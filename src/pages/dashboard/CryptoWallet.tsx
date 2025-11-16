import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bitcoin, ArrowDownToLine, ArrowUpFromLine, Copy, Wallet } from "lucide-react";
import { OTPVerificationModal } from "@/components/dashboard/OTPVerificationModal";
import { CryptoReceipt } from "@/components/dashboard/CryptoReceipt";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import bankLogo from "@/assets/vaultbank-logo.png";

export default function CryptoWallet() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [depositAddresses, setDepositAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

  const [depositData, setDepositData] = useState({
    currency: "BTC",
    amount: "",
    proofFile: null as File | null
  });

  const [withdrawData, setWithdrawData] = useState({
    currency: "",
    amount: "",
    destinationAddress: ""
  });
  
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setUser(user);
    setProfile(profileData);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      const [walletsRes, accountsRes, addressesRes] = await Promise.all([
        supabase.from("crypto_wallets").select("*").eq("user_id", userId),
        supabase.from("accounts").select("*").eq("user_id", userId).eq("status", "active"),
        supabase.from("crypto_deposit_addresses").select("*").eq("is_active", true)
      ]);

      if (walletsRes.data) setWallets(walletsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
      if (addressesRes.data) setDepositAddresses(addressesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };


  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !depositData.proofFile) {
      toast.error("Please upload proof of payment");
      return;
    }

    setProcessingTransaction(true);
    setShowLoadingSpinner(true);
    
    try {
      // Upload proof of payment
      const fileExt = depositData.proofFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('account-documents')
        .upload(fileName, depositData.proofFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('account-documents')
        .getPublicUrl(fileName);

      // Generate reference number
      const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create pending transaction
      if (accounts[0]) {
        // Find the matching VaultBank deposit address for this currency
        const vaultBankAddress = depositAddresses.find(
          addr => addr.currency === depositData.currency
        )?.wallet_address || 'N/A';

        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accounts[0].id,
          type: "credit",
          amount: parseFloat(depositData.amount),
          description: `Crypto Deposit - ${depositData.currency}`,
          status: "pending",
          crypto_currency: depositData.currency,
          wallet_address: vaultBankAddress,
          proof_of_payment_url: publicUrl,
          reference_number: reference
        });
      }

      // Create admin notification (silently fail if permission denied)
      try {
        await supabase.from("admin_notifications").insert({
          notification_type: "crypto_deposit",
          message: `New crypto deposit: ${depositData.currency} $${parseFloat(depositData.amount).toLocaleString()}`,
          user_id: user.id
        });
      } catch (error) {
        console.log("Admin notification creation skipped");
      }

      // Show receipt after a delay
      setTimeout(() => {
        setShowLoadingSpinner(false);
        setReceiptData({
          type: 'deposit',
          currency: depositData.currency,
          amount: depositData.amount,
          reference: reference,
          date: new Date(),
          status: 'pending'
        });
        setShowReceipt(true);
        setDepositData({ currency: "BTC", amount: "", proofFile: null });
      }, 2000);
    
    } catch (error) {
      console.error("Error processing deposit:", error);
      toast.error("Failed to submit deposit request");
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPendingTransaction({
      type: "withdrawal",
      currency: withdrawData.currency,
      amount: parseFloat(withdrawData.amount),
      destinationAddress: withdrawData.destinationAddress
    });
    setShowOTP(true);
  };

  const processWithdrawal = async () => {
    if (!user || !pendingTransaction) return;

    setProcessingTransaction(true);
    setShowLoadingSpinner(true);

    try {
      // Generate reference number
      const reference = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create pending withdrawal transaction
      if (accounts[0]) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accounts[0].id,
          type: "debit",
          amount: pendingTransaction.amount,
          description: `Crypto Withdrawal - ${pendingTransaction.currency}`,
          status: "pending",
          crypto_currency: pendingTransaction.currency,
          wallet_address: pendingTransaction.destinationAddress,
          reference_number: reference
        });

        // Create admin notification for withdrawal (silently fail if permission denied)
        try {
          await supabase.from("admin_notifications").insert({
            notification_type: "crypto_withdrawal",
            message: `Crypto withdrawal request: ${pendingTransaction.currency} $${pendingTransaction.amount.toLocaleString()} to ${pendingTransaction.destinationAddress.substring(0, 10)}...`,
            user_id: user.id
          });
        } catch (error) {
          console.log("Admin notification creation skipped");
        }
      }

      // Show receipt after a delay
      setTimeout(() => {
        setShowLoadingSpinner(false);
        setReceiptData({
          type: 'withdrawal',
          currency: pendingTransaction.currency,
          amount: pendingTransaction.amount.toString(),
          destinationAddress: pendingTransaction.destinationAddress,
          reference: reference,
          date: new Date(),
          status: 'pending'
        });
        setShowReceipt(true);
        setWithdrawData({ currency: "", amount: "", destinationAddress: "" });
      }, 2000);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setProcessingTransaction(false);
      setPendingTransaction(null);
    }
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    processWithdrawal();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Crypto Wallet
        </h1>
        <p className="text-muted-foreground mt-1">Manage your cryptocurrency deposits and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {wallets.length > 0 ? (
          wallets.map((wallet) => (
            <Card key={wallet.id} className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                  {wallet.currency} Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">${parseFloat(wallet.balance || 0).toFixed(2)}</p>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">Wallet Address:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background/50 p-2 rounded block truncate flex-1">
                      {wallet.wallet_address}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(wallet.wallet_address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-3">
            <CardContent className="pt-6 text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No crypto wallets yet</p>
              <p className="text-sm text-muted-foreground">Make a deposit to create your first wallet</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <Tabs defaultValue="deposit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4 mt-6">
              {/* Display Available Deposit Addresses */}
              {depositAddresses.length > 0 && (
                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Available Deposit Addresses
                  </h3>
                  <div className="space-y-3">
                    {depositAddresses.map((address) => (
                      <div key={address.id} className="p-3 bg-background rounded-md border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{address.currency}</span>
                          <span className="text-xs text-muted-foreground">{address.network}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                            {address.wallet_address}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(address.wallet_address);
                              toast.success("Address copied to clipboard!");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          VaultBank's unique {address.currency} wallet address on {address.network} network
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Cryptocurrency</Label>
                  <Select 
                    value={depositData.currency} 
                    onValueChange={(value) => setDepositData({ ...depositData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether USDT</SelectItem>
                      <SelectItem value="USDC">USD Coin</SelectItem>
                      <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                      <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                      <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Amount (USD)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofFile">Proof of Payment</Label>
                  <Input
                    id="proofFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDepositData({ ...depositData, proofFile: e.target.files?.[0] || null })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a screenshot or receipt of your transaction
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  disabled={processingTransaction}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Submit Deposit Request
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4 mt-6">
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Cryptocurrency</Label>
                  <Select value={withdrawData.currency} onValueChange={(value) => setWithdrawData({ ...withdrawData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether USDT</SelectItem>
                      <SelectItem value="USDC">USD Coin</SelectItem>
                      <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                      <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                      <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Amount (USD)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationAddress">Your Wallet Address</Label>
                  <Input
                    id="destinationAddress"
                    placeholder="Paste your wallet address"
                    value={withdrawData.destinationAddress}
                    onChange={(e) => setWithdrawData({ ...withdrawData, destinationAddress: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the wallet address where you want to receive your crypto
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  disabled={processingTransaction}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  Submit Withdrawal Request
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-primary" />
            Important Information
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Deposits are reviewed and processed automatically - no OTP required</li>
            <li>• Withdrawals require OTP verification for security</li>
            <li>• BTC/ETH deposits: 3-10 minutes | USDT/USDC (TRC-20): 1-3 minutes | BNB: 2-5 minutes</li>
            <li>• Network fees may apply for blockchain transactions</li>
            <li>• Always verify wallet addresses before withdrawal</li>
          </ul>
        </CardContent>
      </Card>

      <OTPVerificationModal
        open={showOTP}
        onClose={() => {
          setShowOTP(false);
          setPendingTransaction(null);
        }}
        onVerify={handleOTPVerified}
        email={profile?.email || ""}
      />

      {receiptData && (
        <CryptoReceipt
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
          transactionData={receiptData}
        />
      )}

      {showLoadingSpinner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src={bankLogo} 
              alt="VaultBank" 
              className="h-20 w-auto mx-auto animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <p className="text-lg font-semibold">
              {pendingTransaction ? 'Processing your withdrawal...' : 'Processing your deposit...'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}