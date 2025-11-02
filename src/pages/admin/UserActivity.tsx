import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Globe, Clock, Circle } from "lucide-react";

export default function AdminUserActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to realtime activity
    const channel = supabase
      .channel('user-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity' }, () => {
        fetchActivities();
      })
      .subscribe();

    // Check for online users (active in last 5 minutes)
    const interval = setInterval(() => {
      checkOnlineUsers();
    }, 30000); // Check every 30 seconds

    checkOnlineUsers();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkOnlineUsers = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from("user_activity")
      .select("user_id")
      .gte("created_at", fiveMinutesAgo);

    if (data) {
      const userIds = new Set(data.map(a => a.user_id));
      setOnlineUsers(userIds);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    activity.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    activity.page_url?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByUser = filteredActivities.reduce((acc, activity) => {
    const userId = activity.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(activity);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">User Activity</h1>
        <p className="text-slate-300">Monitor user activity and page visits in real-time</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by user or page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div className="space-y-6">
          {Object.entries(groupedByUser).map(([userId, userActivities]) => {
            const activities = userActivities as any[];
            const user = activities[0]?.profiles;
            const isOnline = onlineUsers.has(userId);

            return (
              <div key={userId} className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{user?.full_name || "Unknown"}</p>
                      <p className="text-slate-400 text-sm">{user?.email}</p>
                    </div>
                  </div>
                  <Badge variant={isOnline ? "default" : "secondary"} className="gap-1">
                    <Circle className={`h-2 w-2 ${isOnline ? "fill-current" : ""}`} />
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-white text-sm font-mono">{activity.page_url}</p>
                          {activity.ip_address && (
                            <p className="text-slate-400 text-xs">
                              IP: {activity.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
