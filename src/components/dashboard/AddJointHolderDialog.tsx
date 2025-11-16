import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface AddJointHolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any;
  onSuccess: () => void;
}

type Step = "form" | "review" | "otp" | "success";

export function AddJointHolderDialog({ open, onOpenChange, account, onSuccess }: AddJointHolderDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    partnerFullName: "",
    partnerEmail: "",
    partnerPhone: "",
    partnerSSN: "",
    partnerAddress: "",
    idDocument: null as File | null,
    driversLicense: null as File | null,
  });

  const requiredDeposit = (account?.balance || 0) * 0.009; // 0.9%

  const handleFileUpload = async (file: File, type: "id" | "license") => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${account.id}_${type}_${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("account-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("account-documents")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmitForm = async () => {
    if (!formData.partnerFullName || !formData.partnerEmail || !formData.partnerPhone || 
        !formData.partnerSSN || !formData.partnerAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setStep("review");
  };

  const handleConfirmAndRequestOTP = async () => {
    if (!termsAccepted) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload documents
      let idDocUrl = null;
      let licenseUrl = null;

      if (formData.idDocument) {
        idDocUrl = await handleFileUpload(formData.idDocument, "id");
      }
      if (formData.driversLicense) {
        licenseUrl = await handleFileUpload(formData.driversLicense, "license");
      }

      // Create joint account request
      const { data: request, error: requestError } = await supabase
        .from("joint_account_requests")
        .insert({
          account_id: account.id,
          requester_user_id: account.user_id,
          partner_full_name: formData.partnerFullName,
          partner_email: formData.partnerEmail,
          partner_phone: formData.partnerPhone,
          partner_ssn: formData.partnerSSN,
          partner_address: formData.partnerAddress,
          partner_id_document_url: idDocUrl,
          partner_drivers_license_url: licenseUrl,
          deposit_amount: requiredDeposit,
          terms_accepted: termsAccepted,
        })
        .select()
        .single();

      if (requestError) throw requestError;
      setRequestId(request.id);

      // Send OTP
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke("send-otp-email", {
          body: { userId: user.id },
        });
      }

      setStep("otp");
      toast({
        title: "OTP sent",
        description: "Please check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify OTP
      const { data: otpRecord } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("code", otpCode)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!otpRecord) {
        throw new Error("Invalid or expired OTP");
      }

      // Update request as verified
      await supabase
        .from("joint_account_requests")
        .update({ otp_verified: true })
        .eq("id", requestId);

      // Delete used OTP
      await supabase.from("otp_codes").delete().eq("id", otpRecord.id);

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "joint_account_request",
        message: `New joint account holder request from ${formData.partnerFullName}`,
      });

      setStep("success");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      partnerFullName: "",
      partnerEmail: "",
      partnerPhone: "",
      partnerSSN: "",
      partnerAddress: "",
      idDocument: null,
      driversLicense: null,
    });
    setTermsAccepted(false);
    setOtpCode("");
    setRequestId(null);
    onOpenChange(false);
    if (step === "success") {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === "form" && "Add Joint Account Holder"}
            {step === "review" && "Review & Confirm"}
            {step === "otp" && "Verify with OTP"}
            {step === "success" && "Request Submitted"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Partner Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.partnerFullName}
                onChange={(e) => setFormData({ ...formData, partnerFullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                value={formData.partnerEmail}
                onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.partnerPhone}
                onChange={(e) => setFormData({ ...formData, partnerPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssn">Social Security Number *</Label>
              <Input
                id="ssn"
                type="password"
                placeholder="XXX-XX-XXXX"
                value={formData.partnerSSN}
                onChange={(e) => setFormData({ ...formData, partnerSSN: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Home Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State, ZIP"
                value={formData.partnerAddress}
                onChange={(e) => setFormData({ ...formData, partnerAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-doc">ID Document (Driver's License/ID Card) *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  id="id-doc"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFormData({ ...formData, idDocument: e.target.files?.[0] || null })}
                />
                <label htmlFor="id-doc" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formData.idDocument ? formData.idDocument.name : "Click to upload ID"}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-doc">Additional Verification (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  id="license-doc"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFormData({ ...formData, driversLicense: e.target.files?.[0] || null })}
                />
                <label htmlFor="license-doc" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formData.driversLicense ? formData.driversLicense.name : "Click to upload additional document"}
                  </span>
                </label>
              </div>
            </div>

            <Button onClick={handleSubmitForm} className="w-full" size="lg">
              Continue to Review
            </Button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account Balance:</span>
                <span className="font-bold text-lg">${account?.balance?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Required Deposit (0.9%):</span>
                <span className="font-bold text-lg text-primary">${requiredDeposit.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-destructive">IMPORTANT: Joint Account Terms</p>
                  <p className="text-foreground/90">
                    Once your partner deposits <span className="font-bold">${requiredDeposit.toFixed(2)}</span> and this joint account is activated:
                  </p>
                  <ul className="space-y-1 list-disc list-inside text-foreground/80 ml-2">
                    <li>Both account holders will have equal rights</li>
                    <li>Direct transfers between joint holders are <span className="font-bold">NOT permitted</span></li>
                    <li>All transfers must go through external accounts</li>
                    <li>This restriction cannot be changed once activated</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I understand and accept the joint account terms. I acknowledge that direct transfers between joint holders will be prohibited once activated.
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleConfirmAndRequestOTP} 
                disabled={!termsAccepted || loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Get OTP"}
              </Button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-3">
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">
                  Verification Code Sent
                </p>
                <p className="text-xs text-muted-foreground">
                  We've sent a 6-digit verification code to <span className="font-semibold">your account email</span> to confirm this joint account holder request.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={handleVerifyOTP} 
              disabled={otpCode.length !== 6 || loading}
              className="w-full"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Submit"}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Request Submitted Successfully!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your joint account holder request for <span className="font-medium">{formData.partnerFullName}</span> has been submitted and is pending admin approval.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">What happens next?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Admin will review the request</li>
                <li>• Partner will be notified to deposit ${requiredDeposit.toFixed(2)}</li>
                <li>• Account will be activated after deposit confirmation</li>
              </ul>
            </div>

            <Button onClick={handleClose} className="w-full" size="lg">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
