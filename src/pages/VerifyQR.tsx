import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Lock } from "lucide-react";

const VerifyQR = () => {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    setUserId(user.id);

    // Check if already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("qr_verified, can_transact")
      .eq("id", user.id)
      .single();

    if (profile?.qr_verified && profile?.can_transact) {
      toast.success("Already verified!");
      navigate("/");
    }
  };

  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCode.trim()) {
      toast.error("Please enter your QR code");
      return;
    }

    if (!userId) {
      toast.error("User not found");
      return;
    }

    setLoading(true);

    try {
      // Get the account application
      const { data: application, error: fetchError } = await supabase
        .from("account_applications")
        .select("qr_code_secret")
        .eq("user_id", userId)
        .single();

      if (fetchError || !application) {
        toast.error("Application not found. Please contact support.");
        setLoading(false);
        return;
      }

      // Verify the QR code matches OR allow test bypass
      const isTestMode = qrCode.trim().toUpperCase() === "TEST123" || qrCode.trim() === "1234";
      
      if (!isTestMode && application.qr_code_secret !== qrCode.trim()) {
        toast.error("Invalid QR code. Please try again.");
        setLoading(false);
        return;
      }

      if (isTestMode) {
        toast.info("Test mode activated - bypassing QR verification");
      }

      // Update application
      const { error: updateAppError } = await supabase
        .from("account_applications")
        .update({ qr_code_verified: true })
        .eq("user_id", userId);

      if (updateAppError) {
        console.error("Error updating application:", updateAppError);
        toast.error("Failed to update application");
        setLoading(false);
        return;
      }

      // Update profile
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ 
          qr_verified: true,
          can_transact: true 
        })
        .eq("id", userId);

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError);
        toast.error("Failed to update profile");
        setLoading(false);
        return;
      }

      toast.success("QR code verified successfully! You can now access all features.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error verifying QR:", error);
      toast.error("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary" />
              <Lock className="h-6 w-6 text-primary absolute bottom-0 right-0" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Please enter the QR code from your email to complete verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyQR} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrCode">QR Code / Secret Key</Label>
              <Input
                id="qrCode"
                type="text"
                placeholder="Enter your QR code or secret key"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the secret key shown below the QR code in your verification email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Security Notice:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>You must complete this verification before any transactions</li>
                <li>Keep your QR code secure and don't share it</li>
                <li>This is a one-time verification process</li>
                <li className="text-blue-500 font-medium">Testing: Use code "TEST123" or "1234" for test accounts</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyQR;
