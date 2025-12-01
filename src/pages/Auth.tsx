import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, Eye, EyeOff, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginOTPModal } from "@/components/dashboard/LoginOTPModal";
import bankLogo from "@/assets/vaultbank-logo.png";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const isRedirecting = useRef(false);
  const isLoggingIn = useRef(false);
  const allowRedirect = useRef(false); // NEW: Only allow redirect after OTP verification
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [pendingUserEmail, setPendingUserEmail] = useState<string>("");
  
  // QR Verification state
  const [showQRVerification, setShowQRVerification] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  // Sign In form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInPin, setSignInPin] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Load remember me preference
    const savedRememberMe = localStorage.getItem('vaultbank_remember_me');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
    }
    
    // Check if user is already logged in and redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isRedirecting.current) {
        // User is already logged in, redirect to dashboard
        isRedirecting.current = true;
        navigate("/bank/dashboard", { replace: true });
        return;
      }
    });

    // Set up listener - BLOCK all automatic redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event, "allowRedirect:", allowRedirect.current);
        
        // ONLY redirect if explicitly allowed after OTP verification
        if (event === 'SIGNED_IN' && session?.user && allowRedirect.current && !isRedirecting.current) {
          isRedirecting.current = true;
          await handleAuthRedirect(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthRedirect = async (user: any) => {
    try {
      // Bypass all verification for test accounts
      if (user.email === 'ambaheu@gmail.com' || user.email === 'test@vaultbank.com') {
        toast.success("Signed in successfully!");
        navigate("/bank/dashboard", { replace: true });
        return;
      }

      // Check profile status
      const { data: profile } = await supabase
        .from("profiles")
        .select("qr_verified, email_verified, can_transact")
        .eq("id", user.id)
        .maybeSingle();

      // If user can transact and is verified, allow access (skip email check if QR verified)
      if (profile?.can_transact && profile?.qr_verified) {
        toast.success("Signed in successfully!");
        navigate("/bank/dashboard", { replace: true });
        return;
      }

      // Check account application status only if can't transact yet
      const { data: application } = await supabase
        .from("account_applications")
        .select("status, qr_code_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      // If account is pending approval
      if (application?.status === 'pending') {
        toast.info(
          "🔍 Your account is under review. Please wait for approval.",
          { duration: 6000 }
        );
        navigate("/bank", { replace: true });
        return;
      }

      // If account is approved but QR not verified
      if (application?.status === 'approved' && !profile?.qr_verified) {
        toast.info("Please complete QR verification");
        navigate("/bank/verify-qr", { replace: true });
        return;
      }

      // If rejected
      if (application?.status === 'rejected') {
        toast.error(
          "Your account application was rejected. Please contact support.",
          { duration: 6000 }
        );
        navigate("/bank", { replace: true });
        return;
      }

      // Default: allow access if no blocking issues
      toast.success("Signed in successfully!");
      navigate("/bank/dashboard", { replace: true });
    } catch (error) {
      console.error("Redirect error:", error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingSpinner(true);
    isLoggingIn.current = true; // Prevent auto-redirect during login flow

    // Ensure spinner shows for at least 2 seconds
    const minSpinnerTime = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Store remember me preference before signing in
      if (rememberMe) {
        localStorage.setItem('vaultbank_remember_me', 'true');
      } else {
        localStorage.removeItem('vaultbank_remember_me');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
          // Check if there's a pending account application for this email
          const { data: application } = await supabase
            .from("account_applications")
            .select("status, created_at")
            .eq("email", signInEmail)
            .maybeSingle();

          if (application) {
            if (application.status === "pending") {
              toast.info(
                "🔍 Your account is currently under review. Our team is reviewing your application and documents for security verification.",
                { duration: 10000 }
              );
              toast.info(
                "📧 You will receive an email notification once your account has been approved. This typically takes 24-48 hours.",
                { duration: 8000 }
              );
            } else if (application.status === "rejected") {
              toast.error(
                "❌ Your account application was not approved. Please contact info@vaulteonline.com for more information.",
                { duration: 10000 }
              );
            } else {
              // Status is approved but login failed - incorrect password
              toast.error("❌ Incorrect email, password, or PIN. Please check your credentials and try again.");
            }
          } else {
            // No application found - invalid credentials
            toast.error("❌ Invalid login credentials. Please check your email and password.");
          }
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        setShowLoadingSpinner(false);
        isLoggingIn.current = false;
        return;
      }

      if (data.user) {
        // Verify PIN
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("pin")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile) {
          toast.error("Failed to verify account details");
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          return;
        }

        // PIN is required - check if it exists and matches
        if (!profile.pin) {
          toast.error("❌ Account setup incomplete. Please contact support to set up your PIN.");
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          return;
        }

        if (profile.pin !== signInPin) {
          toast.error("❌ Incorrect PIN. Please enter the correct 6-digit PIN.");
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          return;
        }

        // PIN verified - now check profile status
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("qr_verified, email_verified, can_transact")
          .eq("id", data.user.id)
          .maybeSingle();

        // If user can transact and is verified, proceed to OTP (skip email check if already QR verified)
        if (fullProfile?.can_transact && fullProfile?.qr_verified) {
          // QR verified - now sign out and require OTP verification
          await supabase.auth.signOut();
          
          setPendingUserId(data.user.id);
          setPendingUserEmail(data.user.email || "");
          setShowLoadingSpinner(false);
          setShowOTPModal(true);
          return;
        }

        // Check account application status only if can't transact yet
        const { data: application } = await supabase
          .from("account_applications")
          .select("status, qr_code_verified")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // Check if account is still pending approval
        if (application?.status === 'pending') {
          toast.info(
            "🔍 Your account is under review. Our team is reviewing your application and documents.",
            { duration: 8000 }
          );
          toast.info(
            "📧 You will receive an email once your account has been approved.",
            { duration: 6000 }
          );
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          return;
        }

        // If account is approved but QR not verified
        if (application?.status === 'approved' && !fullProfile?.qr_verified) {
          toast.info("📧 Please complete email verification with the QR code sent to your inbox.");
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          navigate("/bank/verify-qr");
          return;
        }

        // If rejected
        if (application?.status === 'rejected') {
          toast.error(
            "Your account application was rejected. Please contact support.",
            { duration: 6000 }
          );
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          isLoggingIn.current = false;
          return;
        }

        // Default: Proceed to OTP if all basic checks pass
        await supabase.auth.signOut();
        
        setPendingUserId(data.user.id);
        setPendingUserEmail(data.user.email || "");
        setShowLoadingSpinner(false);
        setShowOTPModal(true);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error?.message || "An error occurred during sign in");
      setShowLoadingSpinner(false);
      isLoggingIn.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    setShowOTPModal(false);
    setShowLoadingSpinner(true);
    
    try {
      // Re-authenticate the user after OTP verification
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (signInError) {
        toast.error("Authentication error. Please try again.");
        setShowLoadingSpinner(false);
        isLoggingIn.current = false;
        return;
      }

      // Mark authentication as complete
      sessionStorage.setItem('auth_verification_completed', 'true');
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('vaultbank_remember_me', 'true');
      } else {
        localStorage.removeItem('vaultbank_remember_me');
      }

      // Wait for minimum spinner time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // NOW allow the auth state listener to redirect
      allowRedirect.current = true;
      isLoggingIn.current = false;
      
      toast.success("Login successful! Welcome back.");
      
      // Get current session and redirect manually
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        isRedirecting.current = true;
        await handleAuthRedirect(session.user);
      }
    } catch (error) {
      console.error("Post-OTP error:", error);
      toast.error("An error occurred. Please try again.");
      setShowLoadingSpinner(false);
      isLoggingIn.current = false;
      allowRedirect.current = false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Generate QR secret
      const qrSecret = crypto.randomUUID();

      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpFullName,
          },
          emailRedirectTo: `${window.location.origin}/bank/login`,
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create account application with approved status for new signups
        const { error: appError } = await supabase
          .from("account_applications")
          .insert({
            user_id: data.user.id,
            email: signUpEmail,
            full_name: signUpFullName,
            account_type: "personal",
            qr_code_secret: qrSecret,
            status: "approved", // Auto-approve new account signups
          });

        if (appError) {
          console.error("Error creating application:", appError);
        }

        toast.success("Account created! Please verify your email to continue.", { duration: 5000 });
        
        // Show QR verification on the same page
        setShowQRVerification(true);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error?.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCode.trim()) {
      toast.error("Please enter your QR code");
      return;
    }

    setQrLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Session expired. Please sign up again.");
        setShowQRVerification(false);
        setQrLoading(false);
        return;
      }

      // Get application to verify QR code
      const { data: application } = await supabase
        .from("account_applications")
        .select("qr_code_secret")
        .eq("user_id", user.id)
        .maybeSingle();

      if (application && application.qr_code_secret !== qrCode.trim()) {
        toast.error("Invalid QR code. Please check your email and try again.");
        setQrLoading(false);
        return;
      }

      // Update application
      if (application) {
        await supabase
          .from("account_applications")
          .update({ qr_code_verified: true })
          .eq("user_id", user.id);
      }

      // Upsert profile to ensure it exists and is updated
      const { error: upsertProfileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id,
          qr_verified: true,
          can_transact: true,
          email: user.email,
          full_name: signUpFullName
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (upsertProfileError) {
        console.error("Error upserting profile:", upsertProfileError);
        toast.error("Failed to update profile");
        setQrLoading(false);
        return;
      }

      toast.success("Email verified! You can now sign in to your account.");
      
      // Sign out and reset form
      await supabase.auth.signOut();
      setShowQRVerification(false);
      setQrCode("");
      setMode("signin");
      
    } catch (error) {
      console.error("Error verifying QR:", error);
      toast.error("An error occurred during verification");
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-xl bg-card rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl border">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 sm:mb-8">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>

        {showQRVerification ? (
          // QR Verification UI
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                  <div className="relative bg-primary/10 p-4 rounded-2xl border border-primary/30">
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold">Verify Your Email</h2>
              <p className="text-sm text-muted-foreground">
                Check your email for the verification code to complete your account setup
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Verification Required
              </p>
              <p className="text-xs text-muted-foreground">
                We've sent a verification email with a secret key. Enter it below to activate your account.
              </p>
            </div>

            <form onSubmit={handleVerifyQR} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrCode" className="text-sm font-semibold">
                  Security Secret Key
                </Label>
                <Input
                  id="qrCode"
                  type="text"
                  placeholder="Enter your secret key from email"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  required
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Copy the secret key from your verification email
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={qrLoading}
              >
                {qrLoading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setShowQRVerification(false);
                  setQrCode("");
                  supabase.auth.signOut();
                }}
              >
                Cancel
              </Button>
            </form>
          </div>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm sm:text-base">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  className="h-11 sm:h-12 text-base"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-sm sm:text-base">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="h-11 sm:h-12 text-base pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-pin" className="text-sm sm:text-base">
                  PIN
                </Label>
                <Input
                  id="signin-pin"
                  type="password"
                  value={signInPin}
                  onChange={(e) => setSignInPin(e.target.value)}
                  required
                  maxLength={6}
                  className="h-11 sm:h-12 text-base"
                  placeholder="Enter your 6-digit PIN"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base touch-manipulation" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="flex flex-col gap-2 text-center">
                <Link
                  to="/forgot-password"
                  className="text-primary font-medium text-sm hover:underline"
                >
                  Forgot Password?
                </Link>
                <Link
                  to="/token-sign-in"
                  className="text-primary font-medium text-sm hover:underline flex items-center justify-center gap-1"
                >
                  Use token instead <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/create-admin-account"
                  className="text-muted-foreground hover:text-foreground text-xs hover:underline flex items-center justify-center gap-1 mt-2 pt-2 border-t border-border"
                >
                  Admin Access <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-sm sm:text-base">
                  Full Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signUpFullName}
                  onChange={(e) => setSignUpFullName(e.target.value)}
                  required
                  className="h-11 sm:h-12 text-base"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm sm:text-base">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="h-11 sm:h-12 text-base"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm sm:text-base">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 sm:h-12 text-base"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm sm:text-base">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 sm:h-12 text-base"
                  placeholder="Re-enter password"
                />
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base touch-manipulation" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </div>

      <LoginOTPModal
        open={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          isLoggingIn.current = false;
          allowRedirect.current = false;
        }}
        onVerify={handleOTPVerified}
        email={pendingUserEmail}
        userId={pendingUserId}
      />

      {showLoadingSpinner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src={bankLogo} 
              alt="VaultBank" 
              className="h-20 w-auto mx-auto animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <p className="text-lg font-semibold">Signing you in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
