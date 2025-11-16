import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Wallet, ArrowLeftRight, Shield, Gift, FileText, CreditCard, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

type NotificationCategory = 'all' | 'account' | 'transaction' | 'security' | 'payment' | 'other';

const NOTIFICATION_CATEGORIES = {
  account: {
    label: 'Account Updates',
    icon: Wallet,
    keywords: ['account', 'joint', 'approved', 'rejected', 'opened', 'closed', 'balance'],
  },
  transaction: {
    label: 'Transactions',
    icon: ArrowLeftRight,
    keywords: ['transfer', 'deposit', 'withdrawal', 'transaction', 'payment received'],
  },
  security: {
    label: 'Security',
    icon: Shield,
    keywords: ['security', 'login', 'password', 'verification', 'otp', 'authentication', 'unauthorized'],
  },
  payment: {
    label: 'Payments & Bills',
    icon: CreditCard,
    keywords: ['payment', 'bill', 'due', 'card', 'purchase'],
  },
  other: {
    label: 'Other',
    icon: Info,
    keywords: [],
  },
};

const categorizeNotification = (notification: Notification): NotificationCategory => {
  const searchText = `${notification.title} ${notification.message}`.toLowerCase();
  
  for (const [category, config] of Object.entries(NOTIFICATION_CATEGORIES)) {
    if (category === 'other') continue;
    if (config.keywords.some(keyword => searchText.includes(keyword))) {
      return category as NotificationCategory;
    }
  }
  
  return 'other';
};

export default function NotificationBar() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          console.log('Notification change:', payload);
          fetchNotifications();
          
          // Show toast for new notifications
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
            
            toast({
              title: "New Notification",
              description: payload.new.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: "Notification deleted",
      });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    if (category === 'all') return Filter;
    return NOTIFICATION_CATEGORIES[category as keyof typeof NOTIFICATION_CATEGORIES]?.icon || Info;
  };

  const getFilteredNotifications = () => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter(n => categorizeNotification(n) === activeCategory);
  };

  const getCategoryCount = (category: NotificationCategory) => {
    if (category === 'all') return notifications.length;
    return notifications.filter(n => categorizeNotification(n) === category).length;
  };

  const getCategoryUnreadCount = (category: NotificationCategory) => {
    if (category === 'all') return unreadCount;
    return notifications.filter(n => !n.is_read && categorizeNotification(n) === category).length;
  };

  const groupNotificationsByDate = (notifs: Notification[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': [],
    };

    notifs.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      const isToday = notifDate.toDateString() === today.toDateString();
      const isYesterday = notifDate.toDateString() === yesterday.toDateString();

      if (isToday) {
        groups['Today'].push(notif);
      } else if (isYesterday) {
        groups['Yesterday'].push(notif);
      } else {
        groups['Earlier'].push(notif);
      }
    });

    return groups;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as NotificationCategory)} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              All
              {getCategoryUnreadCount('all') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {getCategoryUnreadCount('all')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Account</span>
              {getCategoryUnreadCount('account') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {getCategoryUnreadCount('account')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transaction" className="text-xs sm:text-sm">
              <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Transactions</span>
              {getCategoryUnreadCount('transaction') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {getCategoryUnreadCount('transaction')}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant={activeCategory === 'security' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('security')}
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Security
              {getCategoryUnreadCount('security') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {getCategoryUnreadCount('security')}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeCategory === 'payment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('payment')}
              className="text-xs"
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Payments
              {getCategoryUnreadCount('payment') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {getCategoryUnreadCount('payment')}
                </Badge>
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {activeCategory === 'all' 
                    ? 'No notifications yet' 
                    : `No ${NOTIFICATION_CATEGORIES[activeCategory as keyof typeof NOTIFICATION_CATEGORIES]?.label.toLowerCase()} notifications`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupNotificationsByDate(getFilteredNotifications())).map(([dateGroup, notifs]) => (
                  notifs.length > 0 && (
                    <div key={dateGroup}>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                        {dateGroup}
                      </h3>
                      <div className="space-y-2">
                        {notifs.map((notification) => {
                          const category = categorizeNotification(notification);
                          const CategoryIcon = getCategoryIcon(category);
                          
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 rounded-lg border transition-colors ${
                                !notification.is_read
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-card border-border"
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        <CategoryIcon className="w-3 h-3 mr-1" />
                                        {NOTIFICATION_CATEGORIES[category as keyof typeof NOTIFICATION_CATEGORIES]?.label}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <h4 className="font-semibold text-sm mb-1">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 h-7 text-xs"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
