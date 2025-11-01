import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  // Sign In form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAuthRedirect(session.user);
        }
      }
    );

    // Check current user
    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthRedirect = async (user: any) => {
    try {
      // Special case: bypass all verification for test account
      if (user.email === 'ambaheu@gmail.com') {
        toast.success("Signed in successfully! (Test Account)");
        navigate("/dashboard");
        return;
      }

      // For all other users: enforce strict verification
      // Check if email is verified
      if (!user.email_confirmed_at) {
        toast.error("Please verify your email before signing in");
        await supabase.auth.signOut();
        return;
      }

      // Check if QR is verified
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("qr_verified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        toast.error("Please complete account setup");
        return;
      }

      if (!profile?.qr_verified) {
        toast.info("Please complete QR verification");
        navigate("/verify-qr");
      } else {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Redirect error:", error);
      toast.error("Authentication error. Please try again.");
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await handleAuthRedirect(user);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success("Signed in successfully!");
        // The auth state listener will handle the redirect
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
    } finally {
      setLoading(false);
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
          emailRedirectTo: `${window.location.origin}/verify-qr`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create account application
        const { error: appError } = await supabase
          .from("account_applications")
          .insert({
            user_id: data.user.id,
            email: signUpEmail,
            full_name: signUpFullName,
            account_type: "personal",
            qr_code_secret: qrSecret,
            verification_token: data.user.id,
          });

        if (appError) {
          console.error("Error creating application:", appError);
        }

        // Send verification email
        try {
          const { error: emailError } = await supabase.functions.invoke(
            "send-verification-email",
            {
              body: {
                email: signUpEmail,
                fullName: signUpFullName,
                verificationToken: data.user.id,
                qrSecret: qrSecret,
              },
            }
          );

          if (emailError) {
            console.error("Error sending email:", emailError);
            toast.warning("Account created but email sending failed. Please contact support.");
          }
        } catch (emailErr) {
          console.error("Email function error:", emailErr);
        }

        toast.success(
          "Account created! Please check your email for verification instructions including your QR code."
        );

        // Sign out user until they verify
        await supabase.auth.signOut();
        setMode("signin");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-xl bg-card rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl border">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 sm:mb-8">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>

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

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base touch-manipulation" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <Link
                to="/token-sign-in"
                className="text-primary font-medium text-sm hover:underline flex items-center justify-center gap-1 py-2 touch-manipulation"
              >
                Use token instead <ChevronRight className="w-4 h-4" />
              </Link>
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

              <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm font-medium">Security Requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Email verification required</li>
                  <li>QR code authentication required</li>
                  <li>Account review: 2-3 business days</li>
                </ul>
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base touch-manipulation" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
