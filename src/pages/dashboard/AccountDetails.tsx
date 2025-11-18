import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Building2, Globe, CreditCard, Shield, Send, ArrowRight, Lock, CheckCircle2, XCircle } from "lucide-react";

export default function AccountDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get("id");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountDetails, setAccountDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferData, setTransferData] = useState<Record<string, { recipient: string; amount: string }>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchData(user.id);
  };

  const generateSWIFT = () => {
    // VaultBank SWIFT code for international transfers (Chase format: CHASUS33)
    return "VBKNUS33XXX";
  };

  const generateBankAddress = (accountNumber: string) => {
    // VaultBank Brodhead branch address
    return "806 E Exchange St, Brodhead, WI 53520-0108, US";
  };

  const generateRoutingNumber = () => {
    // Generate VaultBank routing number (format: 0xxxxxxxx - 9 digits)
    return `075${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const generateBranchCode = (routingNumber: string) => {
    // Extract branch code from routing number (first 4 digits after the first digit)
    return routingNumber.slice(1, 5);
  };

  const generateFedwireCode = (routingNumber: string) => {
    // Fedwire routing number for wire transfers (Chase format)
    return routingNumber;
  };

  const fetchData = async (userId: string) => {
    try {
      let accountsQuery = supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");
      
      // If accountId is provided, filter for that specific account
      if (accountId) {
        accountsQuery = accountsQuery.eq("id", accountId);
      }

      const [profileRes, accountsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        accountsQuery
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (accountsRes.data) {
        setAccounts(accountsRes.data);
        
        // Fetch account details for each account
        const accountIds = accountsRes.data.map(acc => acc.id);
        const { data: detailsData } = await supabase
          .from("account_details")
          .select("*")
          .in("account_id", accountIds);
        
        if (detailsData) {
          setAccountDetails(detailsData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleTransfer = async (accountId: string) => {
    const data = transferData[accountId];
    if (!data?.recipient || !data?.amount) {
      toast.error("Please fill in all transfer fields");
      return;
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      // Get recipient account details
      const { data: recipientAccount, error: recipientError } = await supabase
        .from("accounts")
        .select("id, user_id")
        .eq("account_number", data.recipient)
        .eq("status", "active")
        .single();

      if (recipientError || !recipientAccount) {
        toast.error("Recipient account not found");
        return;
      }

      // Create transfer transaction
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: accountId,
        type: "transfer",
        amount: amount,
        status: "completed",
        description: `Transfer to account ${data.recipient}`
      });

      if (error) throw error;

      toast.success("Transfer completed successfully!");
      setTransferData(prev => ({ ...prev, [accountId]: { recipient: "", amount: "" } }));
      fetchData(user.id); // Refresh data
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to process transfer");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Account Details & Banking Information
        </h1>
        <p className="text-muted-foreground mt-1">Complete banking details for all your accounts</p>
      </div>

      {accounts.map((account) => {
        const details = accountDetails.find(d => d.account_id === account.id);
        if (!details) return null;

        return (
          <Card key={account.id} className="border-2 border-primary/20 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">{account.account_type.replace('_', ' ').toUpperCase()}</p>
                  <h2 className="text-2xl font-bold">****{account.account_number.slice(-4)}</h2>
                  <p className="text-sm opacity-80 mt-2">Active Account</p>
                </div>
                <Building2 className="h-12 w-12 opacity-30" />
              </div>
            </div>

            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  label="Account Holder Name"
                  value={profile?.full_name || ""}
                  onCopy={() => copyToClipboard(profile?.full_name || "", "Name")}
                />

                <DetailItem
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  label="Account Number"
                  value={account.account_number.padStart(12, '0')}
                  onCopy={() => copyToClipboard(account.account_number.padStart(12, '0'), "Account Number")}
                />

                <DetailItem
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  label="Routing Number (ABA)"
                  value={details.routing_number || "N/A"}
                  onCopy={() => copyToClipboard(details.routing_number || "", "Routing Number")}
                  verified={details.routing_verified}
                />

                <DetailItem
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  label="Wire Routing Number"
                  value={details.routing_number || "N/A"}
                  onCopy={() => copyToClipboard(details.routing_number || "", "Wire Routing")}
                  verified={details.routing_verified}
                />

                <DetailItem
                  icon={<Building2 className="h-5 w-5 text-primary" />}
                  label="Bank Name"
                  value="VaultBank Financial, N.A."
                  onCopy={() => copyToClipboard("VaultBank Financial, N.A.", "Bank Name")}
                />

                <DetailItem
                  icon={<Building2 className="h-5 w-5 text-primary" />}
                  label="Branch Code"
                  value={details.branch_code || "N/A"}
                  onCopy={() => copyToClipboard(details.branch_code || "", "Branch Code")}
                />

                <DetailItem
                  icon={<Globe className="h-5 w-5 text-primary" />}
                  label="Bank Address"
                  value={details.bank_address}
                  onCopy={() => copyToClipboard(details.bank_address, "Bank Address")}
                  fullWidth
                />

                <DetailItem
                  icon={<Globe className="h-5 w-5 text-primary" />}
                  label="SWIFT/BIC Code (International)"
                  value={details.swift_code}
                  onCopy={() => copyToClipboard(details.swift_code, "SWIFT Code")}
                />

                <DetailItem
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  label="Account Type"
                  value={account.account_type.replace('_', ' ').toUpperCase()}
                  onCopy={() => copyToClipboard(account.account_type, "Account Type")}
                />

                <DetailItem
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  label="Currency"
                  value="USD"
                  onCopy={() => copyToClipboard("USD", "Currency")}
                />

                <DetailItem
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  label="Account Status"
                  value={account.status.toUpperCase()}
                  onCopy={() => copyToClipboard(account.status, "Status")}
                />
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-primary/10">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Wire Transfer Instructions
                </h4>
                <div className="text-xs space-y-2 text-muted-foreground">
                  <p><strong>Domestic Wires:</strong> Use Routing Number (ABA) and Account Number</p>
                  <p><strong>International Wires:</strong> Use SWIFT Code (VBKNUS33XXX), Account Number, and Bank Address</p>
                  <p><strong>Beneficiary Name:</strong> {profile?.full_name}</p>
                  <p><strong>Beneficiary Bank:</strong> VaultBank Financial, N.A.</p>
                </div>
              </div>

              {/* Quick Transfer Section */}
              <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-semibold">Quick Transfer</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Send money from this account instantly</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient Account Number</label>
                    <Input
                      placeholder="Enter account number"
                      value={transferData[account.id]?.recipient || ""}
                      onChange={(e) => setTransferData(prev => ({
                        ...prev,
                        [account.id]: { ...prev[account.id], recipient: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={transferData[account.id]?.amount || ""}
                      onChange={(e) => setTransferData(prev => ({
                        ...prev,
                        [account.id]: { ...prev[account.id], amount: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <Button 
                    onClick={() => handleTransfer(account.id)}
                    className="w-full"
                    size="lg"
                  >
                    Send Money
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              </CardContent>
          </Card>
        );
      })}

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Important Information</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use these details for receiving domestic and international wire transfers</li>
                <li>• Your account number is 12 digits for all VaultBank accounts</li>
                <li>• SWIFT code (VBKNUS33XXX) is required for international wire transfers</li>
                <li>• For domestic wires, use the 9-digit Routing Number (ABA)</li>
                <li>• Wire routing and ACH routing numbers are the same for VaultBank</li>
                <li>• Keep your account details secure and never share them publicly</li>
                <li>• Contact support immediately if you notice any unauthorized transactions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({ 
  icon, 
  label, 
  value, 
  onCopy, 
  fullWidth = false,
  verified 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy: () => void;
  fullWidth?: boolean;
  verified?: boolean;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {verified !== undefined && (
          <Badge 
            variant={verified ? "default" : "secondary"}
            className="ml-auto gap-1 text-xs"
          >
            {verified ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Unverified
              </>
            )}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-sm break-all">
          {value}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={onCopy}
          className="flex-shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}