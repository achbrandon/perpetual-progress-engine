import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, AlertCircle, CheckCircle, Trash2, Settings as SettingsIcon } from "lucide-react";

export default function Alerts() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertSettings, setAlertSettings] = useState({
    lowBalance: true,
    largeTransaction: true,
    securityAlert: true,
    billReminder: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    fetchAlerts(user.id);
  };

  const fetchAlerts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
      if (user) fetchAlerts(user.id);
    } catch (error) {
      console.error("Error marking alert as read:", error);
      toast.error("Failed to update alert");
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert deleted");
      if (user) fetchAlerts(user.id);
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "security":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Stay informed about your account activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Alert Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="lowBalance" className="cursor-pointer">Low Balance Alerts</Label>
              <Switch
                id="lowBalance"
                checked={alertSettings.lowBalance}
                onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, lowBalance: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="largeTransaction" className="cursor-pointer">Large Transaction Alerts</Label>
              <Switch
                id="largeTransaction"
                checked={alertSettings.largeTransaction}
                onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, largeTransaction: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="securityAlert" className="cursor-pointer">Security Alerts</Label>
              <Switch
                id="securityAlert"
                checked={alertSettings.securityAlert}
                onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, securityAlert: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="billReminder" className="cursor-pointer">Bill Payment Reminders</Label>
              <Switch
                id="billReminder"
                checked={alertSettings.billReminder}
                onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, billReminder: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No alerts</p>
                <p className="text-sm text-muted-foreground mt-2">You're all caught up!</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    alert.is_read ? "bg-background" : "bg-muted/50"
                  }`}
                >
                  <div className="mt-1">{getAlertIcon(alert.alert_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{alert.alert_title}</p>
                      {!alert.is_read && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.alert_message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
