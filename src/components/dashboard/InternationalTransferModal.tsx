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
import { Globe } from "lucide-react";
import bankLogo from "@/assets/vaultbank-logo.png";

interface InternationalTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InternationalTransferModal({ onClose, onSuccess }: InternationalTransferModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientBankAddress, setRecipientBankAddress] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");
  const [intermediaryBank, setIntermediaryBank] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [feeOption, setFeeOption] = useState<"SHA" | "OUR" | "BEN">("SHA");
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
    if (!fromAccount || !recipientName || !recipientAddress || !recipientBank || !swiftCode || !iban || !amount || !purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (swiftCode.length < 8 || swiftCode.length > 11) {
      toast.error("SWIFT code must be 8-11 characters");
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
      const fee = "45.00";
      const reference = `SWIFT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          from_account_id: fromAccount,
          amount: transferAmount,
          transfer_type: "wire",
          status: "pending",
          notes: `International: ${purpose}`,
          currency: currency
        });

      if (error) throw error;

      const selectedAccount = accounts.find(a => a.id === fromAccount);
      
      setTimeout(() => {
        setShowLoadingSpinner(false);
        setReceiptData({
          type: 'international',
          fromAccount: selectedAccount?.account_name || '',
          toAccount: iban,
          recipientName,
          recipientBank,
          amount: transferAmount.toFixed(2),
          currency: getCurrencySymbol(currency),
          reference,
          date: new Date(),
          fee,
          swiftCode,
          accountNumber: iban
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

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      GBP: '£',
      USD: '$',
      JPY: '¥',
      CHF: 'CHF',
      CAD: 'C$',
      AUD: 'A$'
    };
    return symbols[curr] || curr;
  };

  return (
    <>
      <Dialog open={!showReceipt} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              International Transfer (SWIFT)
            </DialogTitle>
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
                      {account.account_name} - ${parseFloat(account.available_balance).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Full Legal Name</Label>
                <Input
                  placeholder="Maria Gonzalez"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="Calle Verde 12, Madrid, Spain"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipient Bank Name</Label>
                <Input
                  placeholder="Banco Santander"
                  value={recipientBank}
                  onChange={(e) => setRecipientBank(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Bank Address</Label>
                <Input
                  placeholder="Madrid, Spain"
                  value={recipientBankAddress}
                  onChange={(e) => setRecipientBankAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SWIFT/BIC Code</Label>
                <Input
                  placeholder="BSCHESMMXXX"
                  maxLength={11}
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label>IBAN / Account Number</Label>
                <Input
                  placeholder="ES91 2100 0418 4502 0005 1332"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Intermediary Bank (Optional)</Label>
              <Input
                placeholder="JPMorgan Chase Bank, SWIFT: CHASUS33"
                value={intermediaryBank}
                onChange={(e) => setIntermediaryBank(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose of Payment</Label>
              <Input
                placeholder="Goods Payment"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fee Payment Option</Label>
              <RadioGroup value={feeOption} onValueChange={(v) => setFeeOption(v as "SHA" | "OUR" | "BEN")}>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="SHA" id="sha" />
                  <Label htmlFor="sha" className="flex-1 cursor-pointer">
                    SHA - Shared (You and recipient split fees)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="OUR" id="our" />
                  <Label htmlFor="our" className="flex-1 cursor-pointer">
                    OUR - You pay all fees
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="BEN" id="ben" />
                  <Label htmlFor="ben" className="flex-1 cursor-pointer">
                    BEN - Recipient pays all fees
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Transfer Information:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Processing time: 1-5 business days</li>
                <li>• Outgoing wire fee: $45</li>
                <li>• Exchange rate applied at time of transfer</li>
              </ul>
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
            <p className="text-lg font-semibold">Processing your international transfer...</p>
          </div>
        </div>
      )}
    </>
  );
}
