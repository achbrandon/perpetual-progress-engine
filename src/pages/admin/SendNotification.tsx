import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Send, Users, Search } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'pending';

export default function SendNotification() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error("Please select at least one user or choose 'Send to All'");
      return;
    }

    setSending(true);
    try {
      const recipientIds = sendToAll ? users.map(u => u.id) : selectedUsers;
      
      // Send notifications to all selected users
      const notifications = recipientIds.map(userId => 
        createNotification({
          userId,
          title: formData.title,
          message: formData.message,
          type: formData.type
        })
      );

      await Promise.all(notifications);

      toast.success(`Notification sent to ${recipientIds.length} user(s)`);
      
      // Reset form
      setFormData({ title: "", message: "", type: "info" });
      setSelectedUsers([]);
      setSendToAll(false);
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Send Notifications</h1>
        <p className="text-slate-300">Send notifications to your clients</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Compose Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Important Update"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Your notification message here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: NotificationType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="sendToAll"
                checked={sendToAll}
                onChange={(e) => {
                  setSendToAll(e.target.checked);
                  if (e.target.checked) {
                    setSelectedUsers([]);
                  }
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="sendToAll" className="cursor-pointer">
                Send to all users ({users.length} users)
              </Label>
            </div>

            <Button 
              onClick={handleSendNotification} 
              disabled={sending || (!sendToAll && selectedUsers.length === 0)}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send to ${sendToAll ? users.length : selectedUsers.length} user(s)`}
            </Button>
          </CardContent>
        </Card>

        {/* Select Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Recipients
              </div>
              <Badge variant="secondary">
                {selectedUsers.length} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={sendToAll}
                />
              </div>
            </div>

            {!sendToAll && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
                </Button>

                <ScrollArea className="h-[400px] border rounded-lg">
                  <div className="p-4 space-y-2">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No users found</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserToggle(user.id)}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                            selectedUsers.includes(user.id) ? "bg-primary/10 border-primary" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{user.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}

            {sendToAll && (
              <div className="p-8 text-center border rounded-lg bg-primary/5">
                <Bell className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-medium">Sending to all users</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your notification will be sent to all {users.length} users
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
