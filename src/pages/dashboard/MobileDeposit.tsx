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
import { Smartphone, Upload, CheckCircle, Clock } from "lucide-react";

export default function MobileDeposit() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositForm, setShowDepositForm] = useState(false);

  const [formData, setFormData] = useState({
    accountId: "",
    amount: "",
    checkNumber: "",
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
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      const [accountsRes, depositsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId).eq("status", "active"),
        supabase.from("mobile_deposits").select("*").eq("user_id", userId).order("deposit_date", { ascending: false }),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (depositsRes.data) setDeposits(depositsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const { error } = await supabase.from("mobile_deposits").insert({
        user_id: user.id,
        account_id: formData.accountId,
        amount: parseFloat(formData.amount),
        check_number: formData.checkNumber || null,
        status: "pending",
      });

      if (error) throw error;

      // Create transaction record for the mobile deposit
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: formData.accountId,
        type: "credit",
        amount: parseFloat(formData.amount),
        description: `Mobile Check Deposit${formData.checkNumber ? ` #${formData.checkNumber}` : ''}`,
        status: "pending"
      });

      toast.success("Check deposit submitted successfully");
      setShowDepositForm(false);
      setFormData({
        accountId: "",
        amount: "",
        checkNumber: "",
      });
      fetchData(user.id);
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("Failed to submit deposit");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Check Deposit</h1>
          <p className="text-muted-foreground">Deposit checks from anywhere</p>
        </div>
        <Button onClick={() => setShowDepositForm(!showDepositForm)}>
          <Upload className="h-4 w-4 mr-2" />
          New Deposit
        </Button>
      </div>

      {showDepositForm && (
        <Card>
          <CardHeader>
            <CardTitle>Deposit Check</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">Deposit To Account</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
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
                <Label htmlFor="amount">Check Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkNumber">Check Number (Optional)</Label>
                <Input
                  id="checkNumber"
                  value={formData.checkNumber}
                  onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Check Images</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Front of Check</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2">
                      Take Photo
                    </Button>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Back of Check</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2">
                      Take Photo
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please endorse the back of your check before taking photos
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Submit Deposit</Button>
                <Button type="button" variant="outline" onClick={() => setShowDepositForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deposits yet</p>
            ) : (
              deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {deposit.status === "completed" ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Mobile Check Deposit</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deposit.deposit_date).toLocaleDateString()}
                        {deposit.check_number && ` • Check #${deposit.check_number}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${parseFloat(deposit.amount).toFixed(2)}</p>
                    <Badge variant={deposit.status === "completed" ? "default" : "secondary"}>
                      {deposit.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
