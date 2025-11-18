import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Lock, Bell, Shield, Smartphone, Volume2, Music } from "lucide-react";
import { ProfilePictureUpload } from "@/components/dashboard/ProfilePictureUpload";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import { SOUND_OPTIONS, getSoundFile, type NotificationSoundType } from "@/hooks/useNotificationSound";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState(() => {
    const saved = localStorage.getItem('notification_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [inheritanceVolume, setInheritanceVolume] = useState(() => {
    const saved = localStorage.getItem('notification_volume_inheritance');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [transactionVolume, setTransactionVolume] = useState(() => {
    const saved = localStorage.getItem('notification_volume_transaction');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [securityVolume, setSecurityVolume] = useState(() => {
    const saved = localStorage.getItem('notification_volume_security');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [selectedSounds, setSelectedSounds] = useState({
    inheritance: 'inheritance-alert-1',
    transaction: 'transaction-alert-1',
    security: 'security-alert-1',
    general: 'general-alert-1',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchProfile(user.id);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        // Load saved sound selections
        setSelectedSounds({
          inheritance: data.sound_inheritance || 'inheritance-alert-1',
          transaction: data.sound_transaction || 'transaction-alert-1',
          security: data.sound_security || 'security-alert-1',
          general: data.sound_general || 'general-alert-1',
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSoundPreference = async (type: NotificationSoundType, soundId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [`sound_${type}`]: soundId })
        .eq("id", user.id);

      if (error) throw error;

      setSelectedSounds(prev => ({ ...prev, [type]: soundId }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sound updated`);
    } catch (error) {
      console.error("Error updating sound preference:", error);
      toast.error("Failed to update sound preference");
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      
      // Send notification about profile update
      const notification = NotificationTemplates.profileUpdated();
      await createNotification({
        userId: user.id,
        ...notification,
      });
      
      toast.success("Profile updated successfully");
      fetchProfile(user.id);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfilePictureUpload
              userId={user?.id || ""}
              currentAvatarUrl={profile?.avatar_url}
              onUploadComplete={() => fetchProfile(user!.id)}
            />
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile?.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <Button onClick={() => updateProfile({
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone,
            })}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button>Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Enable 2FA</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            {twoFactorEnabled && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm mb-2">Scan this QR code with your authenticator app:</p>
                <div className="bg-white p-4 rounded inline-block">
                  <Smartphone className="h-32 w-32 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="soundNotif" className="cursor-pointer">Notification Sounds</Label>
                <p className="text-sm text-muted-foreground">Play sound when new notifications arrive</p>
              </div>
              <Switch 
                id="soundNotif" 
                checked={notificationSound}
                onCheckedChange={(checked) => {
                  setNotificationSound(checked);
                  localStorage.setItem('notification_sound_enabled', checked.toString());
                  toast.success(checked ? "Notification sounds enabled" : "Notification sounds disabled");
                }}
              />
            </div>
            
            {notificationSound && (
              <div className="p-4 border rounded-lg space-y-6">
                {/* Inheritance Alerts */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Music className="h-4 w-4" />
                    Inheritance Alerts
                  </Label>
                  <Select
                    value={selectedSounds.inheritance}
                    onValueChange={(value) => {
                      updateSoundPreference('inheritance', value);
                      const soundFile = getSoundFile('inheritance', value);
                      const audio = new Audio(soundFile);
                      audio.volume = inheritanceVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.inheritance.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between mt-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Volume
                    </Label>
                    <span className="text-sm text-muted-foreground">{Math.round(inheritanceVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[inheritanceVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => {
                      const newVolume = value[0];
                      setInheritanceVolume(newVolume);
                      localStorage.setItem('notification_volume_inheritance', newVolume.toString());
                      
                      const soundFile = getSoundFile('inheritance', selectedSounds.inheritance);
                      const audio = new Audio(soundFile);
                      audio.volume = newVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                    className="w-full"
                  />
                </div>

                {/* Transaction Alerts */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Music className="h-4 w-4" />
                    Transaction Alerts
                  </Label>
                  <Select
                    value={selectedSounds.transaction}
                    onValueChange={(value) => {
                      updateSoundPreference('transaction', value);
                      const soundFile = getSoundFile('transaction', value);
                      const audio = new Audio(soundFile);
                      audio.volume = transactionVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.transaction.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between mt-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Volume
                    </Label>
                    <span className="text-sm text-muted-foreground">{Math.round(transactionVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[transactionVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => {
                      const newVolume = value[0];
                      setTransactionVolume(newVolume);
                      localStorage.setItem('notification_volume_transaction', newVolume.toString());
                      
                      const soundFile = getSoundFile('transaction', selectedSounds.transaction);
                      const audio = new Audio(soundFile);
                      audio.volume = newVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                    className="w-full"
                  />
                </div>

                {/* Security Alerts */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Music className="h-4 w-4" />
                    Security Alerts
                  </Label>
                  <Select
                    value={selectedSounds.security}
                    onValueChange={(value) => {
                      updateSoundPreference('security', value);
                      const soundFile = getSoundFile('security', value);
                      const audio = new Audio(soundFile);
                      audio.volume = securityVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.security.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between mt-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Volume
                    </Label>
                    <span className="text-sm text-muted-foreground">{Math.round(securityVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[securityVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => {
                      const newVolume = value[0];
                      setSecurityVolume(newVolume);
                      localStorage.setItem('notification_volume_security', newVolume.toString());
                      
                      const soundFile = getSoundFile('security', selectedSounds.security);
                      const audio = new Audio(soundFile);
                      audio.volume = newVolume;
                      audio.play().catch(err => console.log('Audio preview failed:', err));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="emailNotif">Email Notifications</Label>
              <Switch id="emailNotif" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="smsNotif">SMS Notifications</Label>
              <Switch id="smsNotif" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="pushNotif">Push Notifications</Label>
              <Switch id="pushNotif" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trusted Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Chrome on Windows</p>
                <p className="text-sm text-muted-foreground">Last used: Today at 2:30 PM</p>
              </div>
              <Button variant="outline" size="sm">Remove</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Safari on iPhone</p>
                <p className="text-sm text-muted-foreground">Last used: Yesterday at 8:15 AM</p>
              </div>
              <Button variant="outline" size="sm">Remove</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
