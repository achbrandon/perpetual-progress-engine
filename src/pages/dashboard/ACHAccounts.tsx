import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, CheckCircle, Clock, Link as LinkIcon } from "lucide-react";

export default function ACHAccounts() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [achAccounts, setAchAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountType: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    fetchAccounts(user.id);
  };

  const fetchAccounts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("ach_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAchAccounts(data || []);
    } catch (error) {
      console.error("Error fetching ACH accounts:", error);
      toast.error("Failed to load ACH accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const { error } = await supabase.from("ach_accounts").insert({
        user_id: user.id,
        account_name: formData.accountName,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        routing_number: formData.routingNumber,
        account_type: formData.accountType,
        verification_status: "pending"
      });

      if (error) throw error;

      toast.success("ACH account linked successfully! Verification in progress.");
      setShowLinkForm(false);
      setFormData({
        accountName: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        accountType: ""
      });
      fetchAccounts(user.id);
    } catch (error) {
      console.error("Error linking ACH account:", error);
      toast.error("Failed to link ACH account");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Link External Account (ACH)
          </h1>
          <p className="text-muted-foreground mt-1">Connect your external bank accounts for transfers</p>
        </div>
        <Button 
          onClick={() => setShowLinkForm(!showLinkForm)}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Plus className="h-4 w-4 mr-2" />
          Link New Account
        </Button>
      </div>

      {showLinkForm && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Link External Bank Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Nickname</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., Chase Checking"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., Chase Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="9 digits"
                    maxLength={9}
                    value={formData.routingNumber}
                    onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Account number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">
                  Link Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Linked External Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No external accounts linked yet</p>
                <p className="text-sm text-muted-foreground">Link an account to transfer funds</p>
              </div>
            ) : (
              achAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="flex items-center justify-between p-6 border rounded-xl hover:border-primary/50 transition-all hover:shadow-md bg-gradient-to-r from-transparent to-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{account.account_name}</p>
                      <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ••••{account.account_number.slice(-4)} • {account.account_type}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={account.verification_status === "verified" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {account.verification_status === "verified" ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">How ACH Linking Works</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter your external bank account details securely</li>
                <li>• We'll verify your account with micro-deposits (1-2 business days)</li>
                <li>• Once verified, you can transfer funds instantly</li>
                <li>• All transfers are encrypted and protected</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}