import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

interface OTPVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: () => void;
  email: string;
  action?: 'transfer' | 'withdrawal' | 'link_account' | 'domestic_transfer' | 'international_transfer' | 'crypto_withdrawal';
  accountType?: string;
  accountIdentifier?: string;
  amount?: string;
  currency?: string;
}

export function OTPVerificationModal({ open, onClose, onVerify, email, action = 'link_account', accountType, accountIdentifier, amount, currency }: OTPVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [correctOtp, setCorrectOtp] = useState("");

  useEffect(() => {
    if (open) {
      sendOTPEmail();
    }
  }, [open]);

  const sendOTPEmail = async () => {
    try {
      // Generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setCorrectOtp(generatedOtp);
      
      // Send OTP via email
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { 
          email, 
          otp: generatedOtp,
          action,
          accountType,
          accountIdentifier,
          amount,
          currency
        }
      });

      if (error) {
        console.error("Error sending OTP:", error);
        toast.error("Failed to send OTP. Please try again.");
      } else {
        toast.success(`Verification code sent to ${email}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleVerify = () => {
    if (otp === correctOtp) {
      toast.success("OTP verified successfully!");
      onVerify();
    } else {
      toast.error("Invalid OTP code");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verify Transaction
          </DialogTitle>
          <DialogDescription>
            We've sent a verification code to {email}. Please enter it below to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit OTP Code</Label>
            <Input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Check your email for the verification code. The code expires in 10 minutes.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={otp.length !== 6 || loading}
            className="flex-1"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verify & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}