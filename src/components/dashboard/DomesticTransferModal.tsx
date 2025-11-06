import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransferReceipt } from "./TransferReceipt";
import bankLogo from "@/assets/vaultbank-logo.png";

interface DomesticTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function DomesticTransferModal({ onClose, onSuccess }: DomesticTransferModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
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

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    setAccounts(data || []);
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

    setLoading(true);
    setShowLoadingSpinner(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const transferAmount = parseFloat(amount);
      const fee = transferMethod === "Wire" ? "25.00" : "0.00";
      const reference = `DOM${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          from_account: fromAccount,
          to_account: accountNumber,
          amount: transferAmount,
          status: "completed"
        });

      if (error) throw error;

      const selectedAccount = accounts.find(a => a.id === fromAccount);
      
      setTimeout(() => {
        setShowLoadingSpinner(false);
        setReceiptData({
          type: 'domestic',
          fromAccount: selectedAccount?.account_type || '',
          toAccount: accountNumber,
          recipientName,
          recipientBank,
          amount: transferAmount.toFixed(2),
          currency: '$',
          reference,
          date: new Date(),
          fee,
          routingNumber,
          accountNumber
        });
        setShowReceipt(true);
        onSuccess();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Transfer failed");
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
    </>
  );
}
