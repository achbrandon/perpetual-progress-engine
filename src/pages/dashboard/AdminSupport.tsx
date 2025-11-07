import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquare, Clock, User, Send } from "lucide-react";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [userTypingStatus, setUserTypingStatus] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<any>(null);
  
  // Connection status monitoring
  const { status: connectionStatus, isConnected, reconnect: reconnectChannel, lastConnected } = useConnectionStatus(channelRef.current);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
    
    loadTickets();
    subscribeToTickets();
    loadAllUnreadCounts();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    console.log('ADMIN: Selected ticket:', selectedTicket.id);
    loadMessages(selectedTicket.id);
    updateAgentStatus(true);
    markTicketMessagesAsRead(selectedTicket.id);

    // Set up ONE channel for all events for this ticket
    const channel = supabase
      .channel(`admin-ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('ADMIN: New message received via realtime:', {
            id: payload.new.id,
            sender: payload.new.sender_type,
            text: payload.new.message?.substring(0, 30),
            ticket_id: selectedTicket.id
          });

          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) {
              console.log('ADMIN: Duplicate message prevented:', payload.new.id);
              return prev;
            }

            // Play sound for user messages
            if (payload.new.sender_type === 'user' && audioRef.current) {
              console.log('ADMIN: Playing sound for user message');
              audioRef.current.play().catch((e: any) => console.log('Audio failed:', e));
            }

            console.log('ADMIN: Adding message to state, new total:', prev.length + 1);
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('ADMIN: Ticket updated:', {
            agent_typing: payload.new.agent_typing,
            user_typing: payload.new.user_typing,
            ticket_id: selectedTicket.id
          });
          setUserTypingStatus(prev => ({
            ...prev,
            [selectedTicket.id]: payload.new.user_typing
          }));
        }
      )
      .subscribe((status) => {
        console.log('ADMIN: Subscription status:', status);
      });

    // Store channel ref for connection monitoring
    channelRef.current = channel;

    return () => {
      console.log('ADMIN: Cleaning up ticket subscriptions');
      updateAgentStatus(false);
      // Clear typing status on cleanup
      if (selectedTicket?.id) {
        supabase
          .from('support_tickets')
          .update({ agent_typing: false })
          .eq('id', selectedTicket.id)
          .then();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedTicket]);

  const subscribeToTickets = () => {
    const channel = supabase
      .channel('admin-support-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          loadTickets();
          // Update typing status when user_typing changes
          if (payload.new && typeof payload.new === 'object' && 'user_typing' in payload.new && 'id' in payload.new) {
            const newPayload = payload.new as any;
            setUserTypingStatus(prev => ({
              ...prev,
              [newPayload.id]: newPayload.user_typing
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadAllUnreadCounts = async () => {
    try {
      const { data: ticketsData } = await supabase
        .from("support_tickets")
        .select("id");

      if (!ticketsData) return;

      const counts: Record<string, number> = {};
      
      for (const ticket of ticketsData) {
        const { count } = await supabase
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", ticket.id)
          .eq("sender_type", "user")
          .eq("is_read", false);
        
        counts[ticket.id] = count || 0;
      }
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  };

  const markTicketMessagesAsRead = async (ticketId: string) => {
    try {
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_type", "user")
        .eq("is_read", false);
      
      setUnreadCounts(prev => ({ ...prev, [ticketId]: 0 }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const updateAgentStatus = async (online: boolean) => {
    if (!selectedTicket) return;
    await supabase
      .from("support_tickets")
      .update({ agent_online: online })
      .eq("id", selectedTicket.id);
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const messageText = newMessage.trim();
    const tempId = `admin-temp-${Date.now()}`;
    
    // Add message optimistically
    const optimisticMessage = {
      id: tempId,
      ticket_id: selectedTicket.id,
      message: messageText,
      sender_type: "staff",
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    console.log('ADMIN: Adding optimistic message:', tempId);
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setLoading(true);
    
    // Clear agent typing status immediately
    console.log('ADMIN: Clearing agent typing status');
    await supabase
      .from('support_tickets')
      .update({ agent_typing: false })
      .eq('id', selectedTicket.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    try {
      console.log('ADMIN: Sending message to ticket:', selectedTicket.id);
      
      // Insert and get the message back immediately
      const { data: insertedMessage, error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          message: messageText,
          sender_type: "staff"
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('ADMIN: Message sent successfully:', insertedMessage.id);
      
      // Replace optimistic message with real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId);
        // Check if real message already exists (from realtime)
        if (filtered.some(msg => msg.id === insertedMessage.id)) {
          console.log('ADMIN: Real message already in state from realtime');
          return filtered;
        }
        console.log('ADMIN: Replacing optimistic message with real one');
        return [...filtered, insertedMessage];
      });
      
      // Update ticket timestamp
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);
      
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove optimistic message and restore input on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Support Admin Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="open">
              <TabsList className="w-full">
                <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
                <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value="open">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {tickets.filter(t => t.status === 'open').map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {ticket.profiles?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{ticket.profiles?.full_name || 'User'}</p>
                                <p className="text-xs text-muted-foreground">{ticket.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {unreadCounts[ticket.id] > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {unreadCounts[ticket.id]}
                                </Badge>
                              )}
                              {ticket.user_online && (
                                <Badge variant="default" className="text-xs">Online</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.created_at).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="closed">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {tickets.filter(t => t.status === 'closed').map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{ticket.profiles?.full_name || 'User'}</p>
                              <p className="text-xs text-muted-foreground">{ticket.subject}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">Closed</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {selectedTicket ? `Chat with ${selectedTicket.profiles?.full_name || 'User'}` : 'Select a ticket'}
                </CardTitle>
                {selectedTicket && (
                  <ConnectionIndicator 
                    status={connectionStatus}
                    onReconnect={reconnectChannel}
                    lastConnected={lastConnected}
                    showReconnectButton={!isConnected}
                    className="ml-2"
                  />
                )}
              </div>
              {selectedTicket && (
                <Badge variant={selectedTicket.user_online ? "default" : "secondary"}>
                  {selectedTicket.user_online ? "User Online" : "User Offline"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTicket ? (
              <div className="flex flex-col h-[600px]">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender_type === "staff" ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={message.sender_type === "staff" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                            {message.sender_type === "staff" ? "A" : message.sender_type === "bot" ? "B" : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${message.sender_type === "staff" ? "text-right" : ""}`}>
                          <div
                            className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                              message.sender_type === "staff"
                                ? "bg-primary text-primary-foreground text-right"
                                : "bg-muted text-left"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            {message.file_url && (
                              <a 
                                href={message.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs underline mt-2 block"
                              >
                                📎 {message.file_name}
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {userTypingStatus[selectedTicket.id] && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted">U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="inline-block rounded-lg px-4 py-2 bg-muted">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      
                      // Handle typing indicator
                      if (!selectedTicket) return;
                      
                      // Clear existing timeout
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                      
                      if (e.target.value && e.target.value.trim()) {
                        // Set agent typing to true
                        console.log('ADMIN: Setting agent_typing to true for ticket:', selectedTicket.id);
                        supabase
                          .from('support_tickets')
                          .update({ agent_typing: true })
                          .eq('id', selectedTicket.id)
                          .then(({ error }) => {
                            if (error) console.error('ADMIN: Error setting typing:', error);
                            else console.log('ADMIN: Successfully set agent_typing to true');
                          });
                        
                        // Auto-clear after 500ms of no typing
                        typingTimeoutRef.current = setTimeout(() => {
                          console.log('ADMIN: Clearing agent_typing (timeout)');
                          supabase
                            .from('support_tickets')
                            .update({ agent_typing: false })
                            .eq('id', selectedTicket.id)
                            .then();
                        }, 500);
                      } else {
                        // Clear immediately when message is empty
                        console.log('ADMIN: Clearing agent_typing (empty input)');
                        supabase
                          .from('support_tickets')
                          .update({ agent_typing: false })
                          .eq('id', selectedTicket.id)
                          .then();
                      }
                    }}
                    disabled={loading || selectedTicket.status === 'closed'}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={loading || !newMessage.trim() || selectedTicket.status === 'closed'}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a ticket to start chatting</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}