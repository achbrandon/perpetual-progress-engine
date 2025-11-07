import { useState, useEffect } from "react";
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

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [userTypingStatus, setUserTypingStatus] = useState<Record<string, boolean>>({});
  const audioRef = useState<HTMLAudioElement | null>(null)[0];
  const typingChannelRef = useState<any>(null)[0];

  useEffect(() => {
    // Initialize audio
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    (audioRef as any) = audio;
    
    loadTickets();
    subscribeToTickets();
    loadAllUnreadCounts();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      subscribeToMessages(selectedTicket.id);
      subscribeToTyping(selectedTicket.id);
      updateAgentStatus(true);
      markTicketMessagesAsRead(selectedTicket.id);
    }

    return () => {
      if (selectedTicket) {
        updateAgentStatus(false);
      }
      if (typingChannelRef) {
        supabase.removeChannel(typingChannelRef);
      }
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

  const subscribeToTyping = (ticketId: string) => {
    const channel = supabase
      .channel(`ticket-typing-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`
        },
        (payload) => {
          console.log('Typing status update:', payload.new);
          if (payload.new && typeof payload.new === 'object' && 'user_typing' in payload.new) {
            const newPayload = payload.new as any;
            setUserTypingStatus(prev => ({
              ...prev,
              [ticketId]: newPayload.user_typing
            }));
          }
        }
      )
      .subscribe();

    (typingChannelRef as any) = channel;
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

  const subscribeToMessages = (ticketId: string) => {
    const channel = supabase
      .channel(`admin-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('ADMIN SIDE: New message received:', payload.new);
          setMessages(prev => [...prev, payload.new]);
          
          // Play sound and update counter if it's a user message
          if (payload.new.sender_type === 'user') {
            (audioRef as any)?.play().catch((err: any) => console.log('Audio play failed:', err));
            setUnreadCounts(prev => ({
              ...prev,
              [ticketId]: (prev[ticketId] || 0) + 1
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('ADMIN SIDE: Message updated:', payload.new);
          setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          message: newMessage.trim(),
          sender_type: "staff"
        });

      if (error) throw error;
      setNewMessage("");
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
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
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {selectedTicket ? `Chat with ${selectedTicket.profiles?.full_name || 'User'}` : 'Select a ticket'}
              </CardTitle>
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
                    onChange={(e) => setNewMessage(e.target.value)}
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