import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Palette, Bell, Wallet } from "lucide-react";

interface CryptoAddress {
  id: string;
  currency: string;
  wallet_address: string;
  network: string | null;
  is_active: boolean;
}

export default function AdminSettings() {
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([]);
  const [newCurrency, setNewCurrency] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNetwork, setNewNetwork] = useState("");
  const [theme, setTheme] = useState("default");
  const [notificationSound, setNotificationSound] = useState("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoAddresses();
    fetchSettings();
  }, []);

  const fetchCryptoAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("crypto_deposit_addresses")
        .select("*")
        .order("currency");

      if (error) throw error;
      setCryptoAddresses(data || []);
    } catch (error) {
      console.error("Error fetching crypto addresses:", error);
      toast.error("Failed to load crypto addresses");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["theme", "notification_sound"]);

      if (data) {
        const themeSettings = data.find(s => s.setting_key === "theme");
        const soundSettings = data.find(s => s.setting_key === "notification_sound");
        
        if (themeSettings) setTheme(themeSettings.setting_value);
        if (soundSettings) setNotificationSound(soundSettings.setting_value);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleAddCryptoAddress = async () => {
    if (!newCurrency || !newAddress) {
      toast.error("Please fill in currency and wallet address");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .insert({
          currency: newCurrency.toUpperCase(),
          wallet_address: newAddress,
          network: newNetwork || null,
          updated_by: user.id,
        });

      if (error) throw error;

      toast.success("Crypto address added successfully");
      setNewCurrency("");
      setNewAddress("");
      setNewNetwork("");
      fetchCryptoAddresses();
    } catch (error: any) {
      console.error("Error adding crypto address:", error);
      toast.error(error.message || "Failed to add crypto address");
    }
  };

  const handleToggleAddress = async (id: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .update({ 
          is_active: !currentStatus,
          updated_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Address ${!currentStatus ? "activated" : "deactivated"}`);
      fetchCryptoAddresses();
    } catch (error: any) {
      console.error("Error toggling address:", error);
      toast.error(error.message || "Failed to update address");
    }
  };

  const handleSaveTheme = async (newTheme: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "theme",
          setting_type: "appearance",
          setting_value: newTheme,
          updated_by: user.id,
        }, { onConflict: "setting_key" });

      if (error) throw error;

      setTheme(newTheme);
      toast.success("Theme updated successfully");
      
      // Apply theme immediately
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (error: any) {
      console.error("Error saving theme:", error);
      toast.error(error.message || "Failed to save theme");
    }
  };

  const handleSaveNotificationSound = async (sound: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "notification_sound",
          setting_type: "audio",
          setting_value: sound,
          updated_by: user.id,
        }, { onConflict: "setting_key" });

      if (error) throw error;

      setNotificationSound(sound);
      toast.success("Notification sound updated");
      
      // Play preview sound
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.play().catch(() => console.log("Sound preview not available"));
    } catch (error: any) {
      console.error("Error saving sound:", error);
      toast.error(error.message || "Failed to save notification sound");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
        <p className="text-slate-300">Configure system-wide settings</p>
      </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="wallet" className="data-[state=active]:bg-slate-700">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet Settings
          </TabsTrigger>
          <TabsTrigger value="theme" className="data-[state=active]:bg-slate-700">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="sounds" className="data-[state=active]:bg-slate-700">
            <Bell className="h-4 w-4 mr-2" />
            Sounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Crypto Deposit Addresses</CardTitle>
              <CardDescription className="text-slate-300">
                Manage wallet addresses that all users will see for deposits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-slate-300">Currency</Label>
                  <Input
                    placeholder="BTC, ETH, USDT..."
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Wallet Address</Label>
                  <Input
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Network (Optional)</Label>
                  <Input
                    placeholder="ERC20, TRC20..."
                    value={newNetwork}
                    onChange={(e) => setNewNetwork(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button onClick={handleAddCryptoAddress} className="bg-primary hover:bg-primary/90">
                Add Address
              </Button>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Active Addresses</h3>
                {cryptoAddresses.length === 0 ? (
                  <p className="text-slate-400 text-sm">No addresses configured yet</p>
                ) : (
                  cryptoAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{addr.currency}</span>
                          {addr.network && (
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {addr.network}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 font-mono">{addr.wallet_address}</p>
                      </div>
                      <Button
                        variant={addr.is_active ? "default" : "outline"}
                        onClick={() => handleToggleAddress(addr.id, addr.is_active)}
                        className={addr.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {addr.is_active ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Color Theme</CardTitle>
              <CardDescription className="text-slate-300">
                Choose the color scheme for the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "default", label: "Default", colors: "bg-gradient-to-r from-blue-600 to-purple-600" },
                  { value: "hacker", label: "Hacker Green", colors: "bg-gradient-to-r from-green-600 to-emerald-600" },
                  { value: "neon", label: "Neon Pink", colors: "bg-gradient-to-r from-pink-600 to-rose-600" },
                  { value: "ocean", label: "Ocean Blue", colors: "bg-gradient-to-r from-cyan-600 to-blue-600" },
                  { value: "sunset", label: "Sunset Orange", colors: "bg-gradient-to-r from-orange-600 to-red-600" },
                  { value: "forest", label: "Forest", colors: "bg-gradient-to-r from-green-700 to-teal-700" },
                  { value: "royal", label: "Royal Purple", colors: "bg-gradient-to-r from-purple-700 to-indigo-700" },
                  { value: "dark", label: "Pure Dark", colors: "bg-gradient-to-r from-slate-800 to-slate-900" },
                ].map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => handleSaveTheme(themeOption.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === themeOption.value
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className={`h-20 rounded-md ${themeOption.colors} mb-2`}></div>
                    <p className="text-white text-sm font-medium">{themeOption.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Sounds</CardTitle>
              <CardDescription className="text-slate-300">
                Select sound alerts for admin notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Notification Sound</Label>
                <Select value={notificationSound} onValueChange={handleSaveNotificationSound}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-50">
                    <SelectItem value="default" className="text-white hover:bg-slate-800">Default Chime</SelectItem>
                    <SelectItem value="alert" className="text-white hover:bg-slate-800">Alert Beep</SelectItem>
                    <SelectItem value="notification" className="text-white hover:bg-slate-800">Notification Pop</SelectItem>
                    <SelectItem value="bell" className="text-white hover:bg-slate-800">Bell Ring</SelectItem>
                    <SelectItem value="ding" className="text-white hover:bg-slate-800">Ding</SelectItem>
                    <SelectItem value="chime" className="text-white hover:bg-slate-800">Soft Chime</SelectItem>
                    <SelectItem value="ping" className="text-white hover:bg-slate-800">Ping</SelectItem>
                    <SelectItem value="silent" className="text-white hover:bg-slate-800">Silent (No Sound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-900/30 border border-slate-700 rounded-lg">
                <p className="text-sm text-slate-400">
                  Selected: <span className="text-white font-semibold">{notificationSound}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  This sound will play for new transactions, support tickets, and user activities
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
