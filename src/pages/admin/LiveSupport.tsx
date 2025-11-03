import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Circle } from "lucide-react";
import { toast } from "sonner";

export default function LiveSupport() {
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSR4NVqzn77BhGAg+ltryy3Yp');
    
    loadActiveChats();
    
    // Real-time subscriptions
    const ticketsChannel = supabase
      .channel('live-support-tickets')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'support_tickets' 
      }, () => {
        loadActiveChats();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('live-support-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages' 
      }, (payload) => {
        if (!payload.new.is_staff) {
          // Play notification sound for customer messages
          audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
          toast.info("New message from customer", {
            duration: 3000,
          });
        }
        
        if (selectedChat && payload.new.ticket_id === selectedChat.id) {
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new];
          });
          
          // Mark customer messages as read immediately
          if (!payload.new.is_staff) {
            supabase
              .from('support_messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
              .then();
          }
        }
        loadActiveChats();
      })
      .subscribe();

    // Subscribe to ticket updates for typing indicators
    const ticketUpdatesChannel = supabase
      .channel('ticket_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          if (selectedChat && payload.new.id === selectedChat.id) {
            setUserTyping(payload.new.user_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ticketUpdatesChannel);
    };
  }, [selectedChat]);

  // Handle agent typing indicator
  useEffect(() => {
    if (inputMessage && selectedChat) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      supabase
        .from('support_tickets')
        .update({ 
          agent_typing: true,
          agent_typing_at: new Date().toISOString()
        })
        .eq('id', selectedChat.id)
        .then();

      typingTimeoutRef.current = setTimeout(() => {
        supabase
          .from('support_tickets')
          .update({ agent_typing: false })
          .eq('id', selectedChat.id)
          .then();
      }, 3000);
    } else if (selectedChat && !inputMessage) {
      supabase
        .from('support_tickets')
        .update({ agent_typing: false })
        .eq('id', selectedChat.id)
        .then();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputMessage, selectedChat]);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) {
      console.error('Error loading agents:', error);
      return;
    }

    setAgents(data || []);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadActiveChats = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("status", "open")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (tickets && tickets.length > 0) {
        const userIds = tickets.map(t => t.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Merge profiles with tickets
        const chatsWithProfiles = tickets.map(ticket => ({
          ...ticket,
          profiles: profiles?.find(p => p.id === ticket.user_id)
        }));

        setActiveChats(chatsWithProfiles);
      } else {
        setActiveChats([]);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
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

      // Mark as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("is_staff", false)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedChat.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_staff: true
        });

      if (error) throw error;

      await supabase
        .from("support_tickets")
        .update({ 
          updated_at: new Date().toISOString(),
          agent_online: true 
        })
        .eq("id", selectedChat.id);

      setNewMessage("");
      loadMessages(selectedChat.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Live Support Chat
          {activeChats.filter(c => c.user_online).length > 0 && (
            <Badge className="bg-green-600 animate-pulse">
              {activeChats.filter(c => c.user_online).length} Online
            </Badge>
          )}
        </h1>
        <p className="text-slate-300">Real-time customer support conversations</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Active Conversations List */}
        <Card className="col-span-4 bg-slate-800/50 border-slate-700 flex flex-col p-0">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Active Conversations ({activeChats.length})</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {activeChats.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No active conversations
                </div>
              ) : (
                activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id
                        ? "bg-primary/20 border-primary"
                        : "bg-slate-900/50 border-slate-700 hover:bg-slate-900/70"
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {chat.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">
                            {chat.profiles?.full_name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {chat.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {chat.user_online ? (
                          <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
                        ) : (
                          <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-300 text-sm truncate flex-1">
                        {chat.subject}
                      </p>
                      <Badge 
                        className={`ml-2 ${
                          chat.user_online 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {chat.user_online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Messages */}
        <Card className="col-span-8 bg-slate-800/50 border-slate-700 flex flex-col p-0">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {selectedChat.profiles?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white font-semibold">
                        {selectedChat.profiles?.full_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedChat.user_online ? (
                          <>
                            <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                            <span className="text-green-500 text-sm">Online</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                            <span className="text-red-500 text-sm">Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{selectedChat.ticket_type}</Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_staff ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.is_staff
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        <p className="text-sm break-words">{message.message}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Circle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
