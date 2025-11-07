import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, X, Upload, Star, Clock, MessageSquare, History, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface EnhancedSupportChatProps {
  userId?: string;
  onClose: () => void;
}

export function EnhancedSupportChat({ userId, onClose }: EnhancedSupportChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [agentOnline, setAgentOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastTickets, setPastTickets] = useState<any[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [userOnline, setUserOnline] = useState(true);
  const [agentTyping, setAgentTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [agentName, setAgentName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesChannelRef = useRef<any>(null);
  const ticketChannelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (userId) {
      loadOrCreateTicket();
      loadPastTickets();
    }
  }, [userId]);

  useEffect(() => {
    if (ticketId) {
      console.log('Setting up subscriptions for ticket:', ticketId);
      const messagesCleanup = subscribeToMessages();
      const ticketCleanup = subscribeToTicketChanges();
      updateUserOnlineStatus(true);

      return () => {
        console.log('Cleaning up subscriptions');
        messagesCleanup();
        ticketCleanup();
        updateUserOnlineStatus(false);
      };
    }
  }, [ticketId]);

  const subscribeToTicketChanges = () => {
    // Clean up any existing subscription first
    if (ticketChannelRef.current) {
      console.log('Removing existing ticket subscription');
      supabase.removeChannel(ticketChannelRef.current);
      ticketChannelRef.current = null;
    }

    const channel = supabase
      .channel(`ticket-status-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`
        },
        async (payload) => {
          console.log('USER SIDE: Ticket update received:', {
            agent_online: payload.new.agent_online,
            agent_typing: payload.new.agent_typing
          });
          
          setAgentOnline(payload.new.agent_online || false);
          setAgentTyping(payload.new.agent_typing || false);
          setTicket(payload.new);
          
          // Fetch agent name if assigned
          if (payload.new.assigned_agent_id && !agentName) {
            const { data } = await supabase
              .from('support_agents')
              .select('name')
              .eq('id', payload.new.assigned_agent_id)
              .single();
            if (data) setAgentName(data.name);
          }
        }
      )
      .subscribe((status) => {
        console.log('Ticket subscription status:', status);
      });

    ticketChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle user typing indicator with debouncing
  useEffect(() => {
    if (!ticketId) return;

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (newMessage && newMessage.trim()) {
      // Set typing to true (only once, not on every keystroke)
      supabase
        .from('support_tickets')
        .update({ 
          user_typing: true
        })
        .eq('id', ticketId)
        .then();

      // Auto-clear after 500ms of no typing (faster response)
      typingTimeoutRef.current = setTimeout(() => {
        supabase
          .from('support_tickets')
          .update({ user_typing: false })
          .eq('id', ticketId)
          .then();
      }, 500);
    } else {
      // Clear immediately when message is empty
      supabase
        .from('support_tickets')
        .update({ user_typing: false })
        .eq('id', ticketId)
        .then();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, ticketId]);

  const subscribeToMessages = () => {
    // Clean up any existing subscription first
    if (messagesChannelRef.current) {
      console.log('Removing existing message subscription');
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          console.log('USER SIDE: New message received:', payload.new.id);
          setMessages(prev => {
            // Check for duplicate by ID
            const isDuplicate = prev.some(msg => msg.id === payload.new.id);
            if (isDuplicate) {
              console.log('Duplicate message prevented:', payload.new.id);
              return prev;
            }
            
            // Play sound notification if message is from agent or bot
            if (payload.new.sender_type === 'staff' || payload.new.sender_type === 'bot') {
              audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
            }
            
            console.log('Adding new message to state');
            return [...prev, payload.new];
          });
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
          console.log('USER SIDE: Message updated:', payload.new);
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === payload.new.id) {
                // Play sound if message was just marked as read
                if (!msg.is_read && payload.new.is_read && msg.sender_type === 'user') {
                  audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
                }
                return payload.new;
              }
              return msg;
            })
          );
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    messagesChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateUserOnlineStatus = async (online: boolean) => {
    if (!ticketId) return;
    await supabase
      .from("support_tickets")
      .update({ user_online: online })
      .eq("id", ticketId);
  };

  const loadPastTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPastTickets(data || []);
    } catch (error: any) {
      console.error("Error loading past tickets:", error);
    }
  };

  const loadOrCreateTicket = async () => {
    try {
      const { data: existingTickets, error: fetchError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingTickets && existingTickets.length > 0) {
        const currentTicket = existingTickets[0];
        setTicketId(currentTicket.id);
        setTicket(currentTicket);
        setAgentOnline(currentTicket.agent_online || false);
        loadMessages(currentTicket.id);
      } else {
        const { data: newTicket, error: createError } = await supabase
          .from("support_tickets")
          .insert({
            user_id: userId,
            ticket_type: "inquiry",
            subject: "Support Chat",
            description: "Customer initiated support chat",
            status: "open",
            user_online: true
          })
          .select()
          .single();

        if (createError) throw createError;
        setTicketId(newTicket.id);
        setTicket(newTicket);

        setMessages([{
          id: "welcome",
          message: "Hello! Welcome to VaultBank support. An agent will be with you shortly. How can we help you today?",
          sender_type: "staff",
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error: any) {
      console.error("Error loading ticket:", error);
      toast.error("Failed to start chat session");
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      console.log('Loading messages for ticket:', ticketId);
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      console.log('Loaded messages:', data?.length || 0);
      
      // Only set messages if we have data, and deduplicate by ID
      const uniqueMessages = (data || []).reduce((acc: any[], msg: any) => {
        if (!acc.some(m => m.id === msg.id)) {
          acc.push(msg);
        }
        return acc;
      }, []);
      
      setMessages(uniqueMessages);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        message: `Sent file: ${file.name}`,
        sender_type: "user"
      });

      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticketId || !userId) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setLoading(true);

    // Create optimistic message for instant display
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      ticket_id: ticketId,
      message: messageText,
      sender_type: "user",
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Insert the user's message to database
      const { data: insertedMessage, error: insertError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticketId,
          message: messageText,
          sender_type: "user"
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === optimisticMessage.id ? insertedMessage : msg)
      );

      // Clear typing indicator
      await supabase
        .from('support_tickets')
        .update({ user_typing: false })
        .eq('id', ticketId);

      // Check if agent is online, if not use AI bot
      if (!agentOnline && ticket?.chat_mode !== 'agent') {
        console.log('No agent online, calling AI bot...');
        
        // Show bot typing indicator
        setBotTyping(true);
        
        // Call AI bot (don't throw error if bot fails - message still sent)
        try {
          const { data, error: botError } = await supabase.functions.invoke('support-bot', {
            body: { message: messageText, ticketId }
          });

          console.log('Bot response:', data, 'Error:', botError);

          // Reload messages to ensure bot message is displayed
          if (!botError) {
            // Wait a moment for the bot message to be inserted
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadMessages(ticketId);
          }

          // If bot succeeded and suggests live agent
          if (data?.suggestsLiveAgent) {
            // Update ticket to connecting mode
            await supabase
              .from('support_tickets')
              .update({ chat_mode: 'connecting' })
              .eq('id', ticketId);
            
            toast.info("🔄 Finding the best available agent for you...", {
              duration: 3000
            });

            // Call smart agent assignment
            const { data: assignData } = await supabase.functions.invoke('assign-best-agent', {
              body: { ticketId }
            });

            if (assignData?.assigned) {
              toast.success(`✅ Connected to ${assignData.agentName}!`, {
                duration: 4000
              });
            } else {
              toast.info("⏳ All agents are busy. You'll be connected shortly.", {
                duration: 5000
              });
            }
          }
        } catch (botError) {
          // Bot failed, but user's message was still sent successfully
          console.error('Bot error (non-fatal):', botError);
        } finally {
          // Hide bot typing indicator
          setBotTyping(false);
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticketId) return;

    try {
      await supabase
        .from("support_tickets")
        .update({ status: "closed", user_online: false })
        .eq("id", ticketId);

      setShowRating(true);
    } catch (error: any) {
      console.error("Error closing ticket:", error);
      toast.error("Failed to close chat");
    }
  };

  const handleSwitchToLiveAgent = async () => {
    if (!ticketId) return;

    try {
      // Update ticket to connecting mode
      await supabase
        .from('support_tickets')
        .update({ chat_mode: 'connecting' })
        .eq('id', ticketId);
      
      toast.info("🔄 Connecting you to a live agent...", {
        duration: 3000
      });

      // Call smart agent assignment
      const { data: assignData } = await supabase.functions.invoke('assign-best-agent', {
        body: { ticketId }
      });

      if (assignData?.assigned) {
        toast.success(`✅ Connected to ${assignData.agentName}!`, {
          duration: 4000
        });
      } else {
        toast.info("⏳ All agents are currently busy. You'll be connected shortly.", {
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error("Error switching to live agent:", error);
      toast.error("Failed to connect to live agent");
    }
  };

  const handleSubmitRating = async () => {
    if (!ticketId || !userId || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      await supabase.from("support_ratings").insert({
        ticket_id: ticketId,
        user_id: userId,
        rating,
        feedback: ratingFeedback
      });

      toast.success("Thank you for your feedback!");
      onClose();
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-lg">VaultBank Support</DialogTitle>
                 <div className="flex items-center gap-2 mt-1">
                   <Badge variant={agentOnline ? "default" : "secondary"} className="text-xs">
                     {ticket?.chat_mode === 'connecting' ? "Connecting to agent..." :
                      agentOnline ? (agentName ? `${agentName.replace('Support - ', '')} is helping you` : "Agent Online") : 
                      "AI Assistant"}
                   </Badge>
                   {ticket && (
                     <span className="text-xs text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</span>
                   )}
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                title="View chat history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showHistory ? (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-3">
              <h3 className="font-semibold mb-4">Past Conversations</h3>
              {pastTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No past conversations</p>
              ) : (
                pastTickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        ) : showRating ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Rate Your Experience</h3>
              <p className="text-muted-foreground">How was your support experience?</p>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Additional feedback (optional)"
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              rows={4}
              className="max-w-md"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Skip
              </Button>
              <Button onClick={handleSubmitRating} disabled={rating === 0}>
                Submit Rating
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender_type === 'staff' || message.sender_type === 'bot' ? "" : "flex-row-reverse"}`}
                  >
                    <Avatar className="h-10 w-10 border-2">
                      <AvatarFallback className={message.sender_type === 'staff' || message.sender_type === 'bot' ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                        {message.sender_type === 'staff' || message.sender_type === 'bot' ? (agentName ? agentName.charAt(0) : "A") : "You"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.sender_type === 'staff' || message.sender_type === 'bot' ? "" : "text-right"}`}>
                      <div
                        className={`inline-block rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${
                          message.sender_type === 'staff' || message.sender_type === 'bot'
                            ? "bg-muted text-left rounded-tl-none"
                            : "bg-primary text-primary-foreground text-right rounded-tr-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
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
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(message.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.sender_type === 'user' && (
                          <span className="flex items-center gap-1 ml-1">
                            {message.is_read ? (
                              // Read - double checkmark in primary color
                              <>
                                <div className="relative">
                                  <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                                  <Check className="h-3 w-3 text-primary absolute -left-1 top-0" strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] text-primary">Read</span>
                              </>
                            ) : agentOnline ? (
                              // Delivered - double checkmark in gray
                              <>
                                <div className="relative">
                                  <Check className="h-3 w-3" strokeWidth={2.5} />
                                  <Check className="h-3 w-3 absolute -left-1 top-0" strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px]">Delivered</span>
                              </>
                            ) : (
                              // Sent - single checkmark in gray
                              <>
                                <Check className="h-3 w-3" strokeWidth={2.5} />
                                <span className="text-[10px]">Sent</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                     </div>
                   </div>
                 ))}
                  {(agentTyping || botTyping) && (
                   <div className="flex gap-3">
                     <Avatar className="h-10 w-10 border-2">
                       <AvatarFallback className="bg-primary text-primary-foreground">
                         {botTyping ? "🤖" : (agentName ? agentName.charAt(0) : "A")}
                       </AvatarFallback>
                     </Avatar>
                     <div className="flex-1">
                       <div className="inline-block rounded-2xl px-4 py-3 bg-muted rounded-tl-none">
                         <div className="flex items-center gap-2">
                           <div className="flex gap-1">
                             <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                             <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                             <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                           </div>
                           <span className="text-xs text-muted-foreground ml-2">
                             {botTyping ? 'AI is thinking...' : (agentName ? `${agentName.replace('Support - ', '')} is typing...` : 'Agent is typing...')}
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </ScrollArea>

            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2 mb-2">
                {(!agentOnline && ticket?.chat_mode !== 'agent' && ticket?.chat_mode !== 'connecting') && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSwitchToLiveAgent}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Switch to Live Agent
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Attach File"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseTicket}
                >
                  Close Chat
                </Button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={loading || !newMessage.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Max file size: 5MB
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}