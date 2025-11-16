import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Clock, Mail, AlertCircle } from "lucide-react";
import logo from "@/assets/vaultbank-logo.png";

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPending = searchParams.get("status") === "pending";

  useEffect(() => {
    // Auto redirect to login after 10 seconds
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A2E] to-[#16213E]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-2xl relative z-10 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-6 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <img src={logo} alt="VaultBank" className="h-16 w-auto" />
            </div>
          </div>

          {/* Success Icon */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={`absolute inset-0 ${isPending ? 'bg-orange-500/20' : 'bg-green-500/20'} blur-xl rounded-full`}></div>
                <div className={`relative ${isPending ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'} p-4 rounded-2xl border`}>
                  {isPending ? (
                    <Clock className="h-16 w-16 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  )}
                </div>
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-500 via-primary to-accent bg-clip-text text-transparent">
              {isPending ? "Account Pending Approval" : "Account Successfully Verified!"}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {isPending ? "Your verification is complete. Waiting for admin approval." : "Your email verification is complete"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className={`${isPending ? 'bg-orange-500/5 border-orange-500/20' : 'bg-green-500/5 border-green-500/20'} border rounded-xl p-6 space-y-4`}>
            <p className="text-lg font-semibold text-foreground flex items-center gap-3">
              {isPending ? (
                <>
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                  Account Under Review
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  What Happens Next?
                </>
              )}
            </p>
            <div className="space-y-4 ml-9">
              {isPending ? (
                <>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Waiting for Approval</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your security verification is complete! Your account is now waiting for admin approval. You will be notified via email once your account is approved.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Review Process</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Our admin team will review your application and documents. This typically takes 24-48 hours.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notification</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You will receive an email notification once your account is approved. Check your inbox regularly for updates.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Security Review Process</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your documents and account information will be reviewed by our security team for verification purposes. This is a standard procedure to ensure the safety of all our customers.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Review Timeline</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The review process typically takes 24-48 hours. We'll process your application as quickly as possible.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notification</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You will receive an email from us shortly about the status of your account. Please check your inbox regularly for updates.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Important Information
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Please check your spam/junk folder if you don't see our email in your inbox</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can log in to check your application status at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>If you have questions, our support team is available 24/7</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={() => navigate("/auth")}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all"
            >
              Go to Login
            </Button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1 h-12 text-base font-semibold border-primary/20 hover:bg-primary/5"
            >
              Back to Home
            </Button>
          </div>

          {/* Support Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Need assistance?{" "}
              <a href="mailto:info@vaulteonline.com" className="text-primary hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>

          {/* Auto redirect notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground/70">
              You will be automatically redirected to the login page in 10 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationSuccess;
