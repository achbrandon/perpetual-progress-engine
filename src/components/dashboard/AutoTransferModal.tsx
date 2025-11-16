import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Users } from "lucide-react";
import { TransferReceipt } from "./TransferReceipt";
import { createNotification } from "@/lib/notifications";

interface AutoTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AutoTransferModal({ onClose, onSuccess }: AutoTransferModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [formData, setFormData] = useState({
    fromAccountId: "",
    recipientId: "",
    amount: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [accountsRes, recipientsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("status", "active"),
        supabase.from("transfer_recipients").select("*").eq("user_id", user.id).order("last_used_at", { ascending: false })
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (recipientsRes.data) setRecipients(recipientsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
      const recipient = recipients.find(r => r.id === formData.recipientId);

      if (!fromAccount || !recipient) {
        toast.error("Please select valid account and recipient");
        return;
      }

      // Create transfer record
      const { data: transfer, error } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          from_account_id: formData.fromAccountId,
          amount: parseFloat(formData.amount),
          notes: formData.notes || `Transfer to ${recipient.recipient_name}`,
          status: "pending",
          transfer_type: "external",
          currency: "USD"
        })
        .select()
        .single();

      if (error) throw error;

      // Update last used time for recipient
      await supabase
        .from("transfer_recipients")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", formData.recipientId);

      // Send pending notification immediately
      await createNotification({
        userId: user.id,
        title: "Transfer Pending",
        message: `Your transfer of $${formData.amount} to ${recipient.recipient_name} is pending admin approval`,
        type: "pending"
      });

      // Send OTP email if not test account
      if (user.email !== 'ambaheu@gmail.com') {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase.from("otp_codes").insert({
          user_id: user.id,
          email: user.email!,
          code: otpCode,
          transaction_id: transfer.id,
          expires_at: expiresAt
        });

        toast.info("OTP verification code sent to your email");
      }

      // Prepare receipt
      setReceiptData({
        type: "Auto Transfer",
        from: fromAccount.account_name,
        to: recipient.recipient_name,
        amount: formData.amount,
        date: new Date().toISOString(),
        transactionId: transfer.id,
        notes: formData.notes
      });

      setShowReceipt(true);
      toast.success("Transfer initiated successfully! Awaiting confirmation.");
      onSuccess();
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to process transfer");
    } finally {
      setLoading(false);
    }
  };

  if (showReceipt && receiptData) {
    return (
      <TransferReceipt
        {...receiptData}
        onClose={() => {
          setShowReceipt(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Auto Transfer - Quick Send
          </DialogTitle>
        </DialogHeader>

        {recipients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No saved recipients yet</p>
            <p className="text-sm text-muted-foreground">
              Make your first transfer to save recipients for quick access
            </p>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromAccount">From Account</Label>
              <Select value={formData.fromAccountId} onValueChange={(value) => setFormData({ ...formData, fromAccountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - ${parseFloat(account.available_balance).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Send To (Saved Recipient)</Label>
              <Select value={formData.recipientId} onValueChange={(value) => setFormData({ ...formData, recipientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      <div>
                        <p className="font-semibold">{recipient.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {recipient.recipient_bank} • ••••{recipient.recipient_account.slice(-4)}
                        </p>
                      </div>
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
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Payment for..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Send Money"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}