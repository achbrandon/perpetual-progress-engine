import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bankLogo from "@/assets/vaultbank-logo.png";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setFocusedField(null);
    }
  }, [open]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingSpinner(true);

    // Ensure spinner shows for at least 2 seconds
    const minSpinnerTime = new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        setShowLoadingSpinner(false);
        return;
      }

      if (data.user) {
        // Check if user is admin FIRST - admins bypass all other checks
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        // Wait for minimum spinner time before proceeding
        await minSpinnerTime;

        // If admin, redirect to admin panel immediately
        if (roleData) {
          toast.success("Welcome, Admin!");
          onOpenChange(false);
          navigate("/admin");
          return;
        }

        // For regular users: Check profile verification status
        const { data: profile } = await supabase
          .from("profiles")
          .select("qr_verified, email_verified, can_transact, pin")
          .eq("id", data.user.id)
          .maybeSingle();

        // If user can transact and is verified, allow login
        if (profile?.can_transact && profile?.qr_verified) {
          toast.success("Signed in successfully!");
          onOpenChange(false);
          navigate("/dashboard");
          return;
        }

        // Check account application status only if can't transact yet
        const { data: application } = await supabase
          .from("account_applications")
          .select("status, qr_code_verified")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // If account application is pending
        if (application?.status === 'pending') {
          toast.info(
            "🔍 Your account is under review. You'll receive an email once approved.",
            { duration: 6000 }
          );
          await supabase.auth.signOut();
          setLoading(false);
          setShowLoadingSpinner(false);
          onOpenChange(false);
          return;
        }

        // If account is approved but QR not verified
        if (application?.status === 'approved' && !profile?.qr_verified) {
          toast.info("Please complete QR verification to access your account");
          onOpenChange(false);
          navigate("/verify-qr");
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
          onOpenChange(false);
          return;
        }

        // TODO: Add PIN verification step here if needed
        // For now, proceed to dashboard
        toast.success("Signed in successfully!");
        onOpenChange(false);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
      setShowLoadingSpinner(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-8 sm:rounded-2xl animate-scale-in border-0 shadow-2xl">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-8 tracking-tight">Welcome</h1>
          
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1.5 group">
              <Label 
                htmlFor="username" 
                className={`text-sm font-normal transition-colors duration-300 ${
                  focusedField === 'username' || username ? 'text-[hsl(210,100%,50%)]' : 'text-muted-foreground'
                }`}
              >
                Username
              </Label>
              <Input 
                id="username" 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(210,100%,50%)] text-base h-10 transition-all duration-300 bg-transparent"
              />
            </div>

            <div className="space-y-1.5 group">
              <Label 
                htmlFor="password" 
                className={`text-sm font-normal transition-colors duration-300 ${
                  focusedField === 'password' || password ? 'text-[hsl(210,100%,50%)]' : 'text-muted-foreground'
                }`}
              >
                Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(210,100%,50%)] text-base h-10 pr-14 transition-all duration-300 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[hsl(210,100%,50%)] font-semibold text-sm hover:scale-105 transition-transform duration-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center space-x-2 group">
                <Checkbox id="remember" className="transition-transform duration-200 hover:scale-110" />
                <label htmlFor="remember" className="text-sm text-foreground cursor-pointer hover:text-[hsl(210,100%,50%)] transition-colors duration-200">
                  Remember me
                </label>
              </div>
              <Link 
                to="/open-account" 
                className="text-[hsl(210,100%,50%)] font-semibold text-sm hover:underline flex items-center gap-1 hover-scale transition-all duration-200"
                onClick={() => onOpenChange(false)}
              >
                Use token <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="flex items-start gap-3 pt-3">
              <Button 
                type="submit"
                disabled={loading}
                className="h-12 text-base font-semibold flex-1 bg-[hsl(210,100%,50%)] hover:bg-[hsl(210,100%,45%)] hover:shadow-lg hover:scale-105 transition-all duration-300 active:scale-95"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="flex flex-col gap-1.5 justify-center">
                <Link 
                  to="/open-account" 
                  className="text-[hsl(210,100%,50%)] font-semibold text-xs hover:underline flex items-center gap-1 whitespace-nowrap group transition-all duration-200"
                  onClick={() => onOpenChange(false)}
                >
                  Forgot username/password <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link 
                  to="/open-account" 
                  className="text-[hsl(210,100%,50%)] font-semibold text-xs hover:underline flex items-center gap-1 whitespace-nowrap group transition-all duration-200"
                  onClick={() => onOpenChange(false)}
                >
                  Not Enrolled? Sign Up Now. <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>

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
    </Dialog>
  );
};
