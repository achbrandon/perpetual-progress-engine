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
import QRCode from "qrcode";

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
  const [depositQrCode, setDepositQrCode] = useState<string>("");

  const [depositData, setDepositData] = useState({
    currency: "BTC",
    network: "",
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

  // Generate QR code for deposit address
  useEffect(() => {
    // Normalize network names for flexible matching
    const normalizeNetwork = (network: string) => {
      const normalized = network.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.includes('trc') && normalized.includes('20')) return 'trc20';
      if (normalized.includes('erc') && normalized.includes('20')) return 'erc20';
      if (normalized.includes('bep') && normalized.includes('20')) return 'bep20';
      return normalized;
    };
    
    const matchingAddress = depositAddresses.find(
      addr => addr.currency === depositData.currency && 
        normalizeNetwork(addr.network) === normalizeNetwork(depositData.network)
    );
    
    if (matchingAddress?.wallet_address) {
      QRCode.toDataURL(matchingAddress.wallet_address, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setDepositQrCode).catch(console.error);
    } else {
      setDepositQrCode("");
    }
  }, [depositData.currency, depositData.network, depositAddresses]);

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
        // Find the matching VaultBank deposit address for this currency AND network
        // Normalize network names for flexible matching
        const normalizeNetwork = (network: string) => {
          const normalized = network.toLowerCase().replace(/[^a-z0-9]/g, '');
          // Handle TRC-20 variations: "trc 20", "trc20", "Tron (TRC-20)", etc.
          if (normalized.includes('trc') && normalized.includes('20')) return 'trc20';
          // Handle ERC-20 variations
          if (normalized.includes('erc') && normalized.includes('20')) return 'erc20';
          // Handle BEP-20 variations
          if (normalized.includes('bep') && normalized.includes('20')) return 'bep20';
          return normalized;
        };
        
        const depositAddress = depositAddresses.find(
          addr => addr.currency === depositData.currency && 
            normalizeNetwork(addr.network) === normalizeNetwork(depositData.network)
        );

        if (!depositAddress) {
          toast.error(`${depositData.currency} ${depositData.network} deposit address not available. Please contact support.`);
          setProcessingTransaction(false);
          setShowLoadingSpinner(false);
          return;
        }

        const vaultBankAddress = depositAddress.wallet_address;
        const network = depositAddress.network;

        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accounts[0].id,
          type: "credit",
          amount: parseFloat(depositData.amount),
          description: `Crypto Deposit - ${depositData.currency} (${network})`,
          status: "pending",
          crypto_currency: depositData.currency,
          crypto_network: network,
          wallet_address: vaultBankAddress,
          proof_of_payment_url: publicUrl,
          reference_number: reference
        });
      }

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "crypto_deposit",
        message: `New crypto deposit: ${depositData.currency} $${parseFloat(depositData.amount).toLocaleString()}`,
        user_id: user.id
      });

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
        setDepositData({ currency: "BTC", network: "", amount: "", proofFile: null });
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
        // Determine network based on currency and destination address format
        let network = 'Unknown';
        const address = pendingTransaction.destinationAddress.toLowerCase();
        
        if (pendingTransaction.currency === 'BTC') {
          network = 'Bitcoin Mainnet';
        } else if (pendingTransaction.currency === 'ETH') {
          network = 'Ethereum (ERC-20)';
        } else if (pendingTransaction.currency === 'USDT') {
          // Try to determine USDT network from address
          if (address.startsWith('t') && address.length === 34) {
            network = 'Tron (TRC-20)';
          } else if (address.startsWith('0x')) {
            network = 'Ethereum (ERC-20)';
          } else {
            network = 'USDT';
          }
        } else if (pendingTransaction.currency === 'BNB') {
          network = 'BNB Smart Chain (BEP-20)';
        } else if (pendingTransaction.currency === 'SOL') {
          network = 'Solana';
        } else if (pendingTransaction.currency === 'XRP') {
          network = 'XRP Ledger';
        } else if (pendingTransaction.currency === 'ADA') {
          network = 'Cardano';
        }

        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accounts[0].id,
          type: "debit",
          amount: pendingTransaction.amount,
          description: `Crypto Withdrawal - ${pendingTransaction.currency}`,
          status: "pending",
          crypto_currency: pendingTransaction.currency,
          crypto_network: network,
          wallet_address: pendingTransaction.destinationAddress,
          reference_number: reference
        });

        // Create admin notification for withdrawal
        await supabase.from("admin_notifications").insert({
          notification_type: "crypto_withdrawal",
          message: `Crypto withdrawal request: ${pendingTransaction.currency} $${pendingTransaction.amount.toLocaleString()} to ${pendingTransaction.destinationAddress.substring(0, 10)}...`,
          user_id: user.id
        });
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
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Cryptocurrency</Label>
                  <Select 
                    value={depositData.currency} 
                    onValueChange={(value) => setDepositData({ ...depositData, currency: value, network: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                      <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                      <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                      <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {depositData.currency && (
                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Select 
                      value={depositData.network} 
                      onValueChange={(value) => setDepositData({ ...depositData, network: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {depositData.currency === "BTC" && (
                          <SelectItem value="Bitcoin Mainnet">Bitcoin Mainnet</SelectItem>
                        )}
                        {depositData.currency === "ETH" && (
                          <SelectItem value="Ethereum (ERC-20)">Ethereum (ERC-20)</SelectItem>
                        )}
                        {depositData.currency === "USDT" && (
                          <>
                            <SelectItem value="Tron (TRC-20)">Tron (TRC-20)</SelectItem>
                            <SelectItem value="Ethereum (ERC-20)">Ethereum (ERC-20)</SelectItem>
                            <SelectItem value="BNB Smart Chain (BEP-20)">BNB Smart Chain (BEP-20)</SelectItem>
                          </>
                        )}
                        {depositData.currency === "USDC" && (
                          <>
                            <SelectItem value="Ethereum (ERC-20)">Ethereum (ERC-20)</SelectItem>
                            <SelectItem value="Solana">Solana</SelectItem>
                            <SelectItem value="BNB Smart Chain (BEP-20)">BNB Smart Chain (BEP-20)</SelectItem>
                          </>
                        )}
                        {depositData.currency === "BNB" && (
                          <SelectItem value="BNB Smart Chain (BEP-20)">BNB Smart Chain (BEP-20)</SelectItem>
                        )}
                        {depositData.currency === "SOL" && (
                          <SelectItem value="Solana">Solana</SelectItem>
                        )}
                        {depositData.currency === "XRP" && (
                          <SelectItem value="XRP Ledger">XRP Ledger</SelectItem>
                        )}
                        {depositData.currency === "ADA" && (
                          <SelectItem value="Cardano">Cardano</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Important: Select the correct network to avoid loss of funds
                    </p>
                  </div>
                )}

                {/* Display Deposit Address for Selected Currency & Network */}
                {depositData.currency && depositData.network && (() => {
                  // Normalize network names for flexible matching
                  const normalizeNetwork = (network: string) => {
                    const normalized = network.toLowerCase().replace(/[^a-z0-9]/g, '');
                    // Handle TRC-20 variations: "trc 20", "trc20", "Tron (TRC-20)", etc.
                    if (normalized.includes('trc') && normalized.includes('20')) return 'trc20';
                    // Handle ERC-20 variations
                    if (normalized.includes('erc') && normalized.includes('20')) return 'erc20';
                    // Handle BEP-20 variations
                    if (normalized.includes('bep') && normalized.includes('20')) return 'bep20';
                    return normalized;
                  };
                  
                  const matchingAddress = depositAddresses.find(
                    addr => addr.currency === depositData.currency && 
                      normalizeNetwork(addr.network) === normalizeNetwork(depositData.network)
                  );
                  
                  if (matchingAddress) {
                    return (
                      <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          VaultBank Deposit Address
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{matchingAddress.currency}</span>
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded border">
                              {matchingAddress.network}
                            </span>
                          </div>
                          
                          {/* QR Code */}
                          {depositQrCode && (
                            <div className="flex justify-center p-4 bg-background rounded-lg border">
                              <img src={depositQrCode} alt="Wallet Address QR Code" className="w-48 h-48" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-background p-3 rounded border break-all font-mono">
                              {matchingAddress.wallet_address}
                            </code>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(matchingAddress.wallet_address);
                                toast.success("Address copied to clipboard!");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                              ⚠️ CRITICAL: Send only {matchingAddress.currency} to this address via {matchingAddress.network} network. 
                              Sending other cryptocurrencies or using a different network will result in permanent loss of funds.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          <span>
                            <strong>Network not available yet.</strong> The {depositData.currency} {depositData.network} deposit address 
                            is being set up. Please contact support or try a different network.
                          </span>
                        </p>
                      </div>
                    );
                  }
                })()}

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
                  disabled={processingTransaction || !depositData.currency || !depositData.network || !depositData.amount || !depositData.proofFile}
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
                    Enter your external wallet address where you want to send your crypto
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
        action="crypto_withdrawal"
        currency={pendingTransaction?.currency}
        amount={pendingTransaction?.amount?.toString()}
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