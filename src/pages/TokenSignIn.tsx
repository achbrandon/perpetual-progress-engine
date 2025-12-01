import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoginOTPModal } from "@/components/dashboard/LoginOTPModal";
import logo from "@/assets/vaultbank-logo.png";
import bgImage from "@/assets/banking-hero.jpg";

const TokenSignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requestingToken, setRequestingToken] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>("");

  useEffect(() => {
    // Show loading spinner for 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRequestToken = async () => {
    if (!username) {
      toast.error("Please enter your email address");
      return;
    }

    setRequestingToken(true);
    try {
      // Get user's QR code from account_applications
      const { data: userData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", username)
        .single();

      if (!userData) {
        toast.error("Account not found");
        setRequestingToken(false);
        return;
      }

      const { data: application } = await supabase
        .from("account_applications")
        .select("qr_code_secret, full_name")
        .eq("user_id", userData.id)
        .single();

      if (!application?.qr_code_secret) {
        toast.error("Token not found for this account");
        setRequestingToken(false);
        return;
      }

      // Send token via email using existing edge function
      const { error: emailError } = await supabase.functions.invoke("send-verification-email", {
        body: {
          email: username,
          fullName: application.full_name || "User",
          verificationToken: application.qr_code_secret,
          qrSecret: application.qr_code_secret,
        }
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast.error("Failed to send token. Please try again.");
      } else {
        toast.success("Token sent to your email!");
      }
    } catch (error: any) {
      console.error("Request token error:", error);
      toast.error("Failed to request token");
    } finally {
      setRequestingToken(false);
    }
  };

  const handleOTPVerified = async () => {
    setShowOTPModal(false);
    toast.success("Signed in successfully!");
    navigate("/bank/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !token) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Verify password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (authError) {
        toast.error("Invalid email or password");
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        toast.error("Authentication failed");
        setSubmitting(false);
        return;
      }

      // Step 2: Verify token (QR code)
      const { data: application } = await supabase
        .from("account_applications")
        .select("qr_code_secret, status")
        .eq("user_id", authData.user.id)
        .single();

      if (!application) {
        toast.error("Account application not found");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      if (application.qr_code_secret !== token.trim()) {
        toast.error("Invalid token");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      if (application.status !== 'approved') {
        toast.info(
          "🔍 Your account is under review. Our team is reviewing your application.",
          { duration: 6000 }
        );
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      // Step 3: Check if email is verified
      if (!authData.user.email_confirmed_at) {
        toast.info(
          "🔍 Your account verification is complete. Waiting for final email confirmation.",
          { duration: 6000 }
        );
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      // Step 4: Check QR verification status
      const { data: profile } = await supabase
        .from("profiles")
        .select("qr_verified")
        .eq("id", authData.user.id)
        .single();

      if (!profile?.qr_verified) {
        toast.info(
          "🔍 Your account verification is complete. Waiting for final approval.",
          { duration: 6000 }
        );
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      // Step 5: Trigger OTP verification
      setPendingUserId(authData.user.id);
      setShowOTPModal(true);
      setSubmitting(false);

    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(210,100%,50%)] flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logo} 
            alt="VaultBank" 
            className="w-32 h-32 mx-auto mb-8 animate-spin"
            style={{ animationDuration: '2s' }}
          />
          <p className="text-white text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <img src={logo} alt="VaultBank" className="w-16 h-16" />
          <h1 className="text-4xl font-bold text-foreground">VaultBank</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-4">Token Sign In</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Please enter your credentials and verification token
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-base font-normal text-muted-foreground">
              Username
            </Label>
            <Input 
              id="username" 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-normal text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-lg h-12 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[hsl(210,100%,50%)] font-semibold text-base hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token" className="text-base font-normal text-muted-foreground">
                Token
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRequestToken}
                disabled={requestingToken || !username}
                className="text-[hsl(210,100%,50%)] hover:text-[hsl(210,100%,45%)] p-0 h-auto font-semibold"
              >
                <Mail className="w-4 h-4 mr-1" />
                {requestingToken ? "Sending..." : "Request Token"}
              </Button>
            </div>
            <Input 
              id="token" 
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your verification token"
              className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-lg h-12"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the token sent to your email
            </p>
          </div>

          <Button 
            type="submit"
            disabled={submitting}
            className="w-full h-14 text-lg font-semibold bg-[hsl(210,100%,50%)] hover:bg-[hsl(210,100%,45%)] mt-8"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>

          <Link 
            to="/bank/login" 
            className="text-[hsl(210,100%,50%)] font-semibold text-base hover:underline flex items-center gap-1 justify-center mt-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Token Login Process
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>1. Enter your email and click "Request Token"</li>
            <li>2. Check your email for the verification token</li>
            <li>3. Enter the token, your password, and complete OTP verification</li>
          </ul>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          © 2025 VaultBank. All rights reserved.
        </div>
      </div>

      <LoginOTPModal
        open={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          supabase.auth.signOut();
        }}
        userId={pendingUserId}
        email={username}
        onVerify={handleOTPVerified}
      />
    </div>
  );
};

export default TokenSignIn;
