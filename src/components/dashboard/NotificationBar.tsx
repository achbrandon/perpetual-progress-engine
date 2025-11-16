import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Wallet, ArrowLeftRight, Shield, Gift, FileText, CreditCard, Filter, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { formatDistanceToNow, format } from "date-fns";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<NotificationCategory[]>(['all']);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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
            // Check if sound is enabled
            const soundEnabled = localStorage.getItem('notification_sound_enabled');
            if (soundEnabled === null || soundEnabled === 'true') {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.log('Audio play failed:', e));
            }
            
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

  const toggleCategory = (category: NotificationCategory) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
      setActiveCategory('all');
    } else {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories.filter(c => c !== 'all'), category];
      
      setSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories);
      setActiveCategory(newCategories[0] || 'all');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.message.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.created_at);
        const from = dateRange.from!;
        const to = dateRange.to || new Date();
        return notifDate >= from && notifDate <= to;
      });
    }

    // Apply category filter
    if (!selectedCategories.includes('all')) {
      filtered = filtered.filter(n => 
        selectedCategories.includes(categorizeNotification(n))
      );
    }

    return filtered;
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
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-8"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="px-4 py-3 space-y-3 border-b">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-9 text-xs">
                <Calendar className="mr-2 h-3.5 w-3.5" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Filter by date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
              />
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="w-full text-xs"
                >
                  Clear dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Category Multi-Select - Mobile Optimized */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(NOTIFICATION_CATEGORIES).map(([key, config]) => {
              const category = key as NotificationCategory;
              const isSelected = selectedCategories.includes(category) || selectedCategories.includes('all');
              const CategoryIcon = config.icon;
              const count = getCategoryUnreadCount(category);

              return (
                <Button
                  key={key}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="text-[10px] h-7 px-2"
                >
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{key === 'all' ? 'All' : key.charAt(0).toUpperCase()}</span>
                  {count > 0 && (
                    <Badge variant="destructive" className="ml-1 h-3.5 w-3.5 p-0 text-[9px] leading-none flex items-center justify-center">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1 mt-4">
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
      </SheetContent>
    </Sheet>
  );
}
