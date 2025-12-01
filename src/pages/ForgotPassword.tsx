import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, Lock } from "lucide-react";
import logo from "@/assets/vaultbank-logo.png";

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "security" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user exists and get their security question
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, security_question, security_answer, email")
        .eq("email", email)
        .single();

      if (error || !profile) {
        toast.error("No account found with this email address");
        setLoading(false);
        return;
      }

      if (!profile.security_question) {
        toast.error("No security question set for this account. Please contact support.");
        setLoading(false);
        return;
      }

      // Generate reset token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Store reset request
      await supabase.from("password_reset_requests").insert({
        user_id: profile.id,
        email: email,
        reset_token: token,
        security_question: profile.security_question,
        security_answer: profile.security_answer,
        expires_at: expiresAt.toISOString(),
      });

      setResetToken(token);
      setSecurityQuestion(profile.security_question);
      setStep("security");
      toast.success("Security question loaded. Please answer to proceed.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify security answer
      const result: any = await (supabase as any)
        .from("password_reset_requests")
        .select("*")
        .eq("reset_token", resetToken)
        .single();
      
      const { data: request, error } = result;

      if (error || !request) {
        toast.error("Invalid or expired reset request");
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date(request.expires_at) < new Date()) {
        toast.error("Reset token has expired. Please start over.");
        setStep("email");
        setLoading(false);
        return;
      }

      // Verify answer (case-insensitive comparison)
      if (securityAnswer.trim().toLowerCase() !== request.security_answer.trim().toLowerCase()) {
        toast.error("Incorrect answer to security question");
        setLoading(false);
        return;
      }

      // Mark as verified
      await (supabase as any)
        .from("password_reset_requests")
        .update({ verified: true })
        .eq("reset_token", resetToken);

      setStep("reset");
      toast.success("Security answer verified! You can now reset your password.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Verify reset request is still valid and verified
      const result: any = await (supabase as any)
        .from("password_reset_requests")
        .select("*")
        .eq("reset_token", resetToken)
        .eq("verified", true)
        .single();
      
      const { data: request, error: requestError } = result;

      if (requestError || !request) {
        toast.error("Invalid or unverified reset request");
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date(request.expires_at) < new Date()) {
        toast.error("Reset token has expired. Please start over.");
        setStep("email");
        setLoading(false);
        return;
      }

      // Send password reset email through Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/bank/login`,
      });

      if (resetError) throw resetError;

      toast.success("Password reset email sent! Check your inbox to complete the process.");
      
      // Clean up used reset request
      await (supabase as any)
        .from("password_reset_requests")
        .delete()
        .eq("reset_token", resetToken);

      setTimeout(() => navigate("/bank/login"), 2000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-xl border">
        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="VaultBank" className="h-16" />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {step === "email" && "Forgot Password"}
            {step === "security" && "Verify Identity"}
            {step === "reset" && "Reset Password"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "email" && "Enter your email to begin password recovery"}
            {step === "security" && "Answer your security question to verify your identity"}
            {step === "reset" && "A reset link will be sent to your email"}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Continue"}
            </Button>
          </form>
        )}

        {step === "security" && (
          <form onSubmit={handleSecurityAnswerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Security Question</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{securityQuestion}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Input
                id="answer"
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify Answer"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                ✓ Identity verified. You'll receive a password reset link via email.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/bank/login"
            className="text-primary font-medium text-sm hover:underline flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            Need help? Contact{" "}
            <Link to="/bank/dashboard/support" className="text-primary hover:underline">
              Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;