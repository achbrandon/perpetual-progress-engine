import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";

export default function RequestAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/bank/login");
        return;
      }

      // Create account request
      await supabase.from("account_requests").insert({
        user_id: user.id,
        account_type: accountType,
        status: 'pending'
      });

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "account_request",
        message: `Account request: ${accountType} account`,
        user_id: user.id
      });

      toast.success("Pending request - Your account will be automatically created within 30 minutes");
      setTimeout(() => navigate("/bank/dashboard/accounts"), 2000);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request Additional Account</h1>
        <p className="text-muted-foreground">Add a new account to your profile</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            New Account Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={accountType} onValueChange={setAccountType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="money_market">Money Market Account</SelectItem>
                  <SelectItem value="cd">Certificate of Deposit (CD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                What happens next?
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your account will be automatically created within 30 minutes</li>
                <li>• You'll receive a notification when it's ready</li>
                <li>• The new account will appear in your dashboard with full details</li>
                <li>• No additional documentation required</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || !accountType}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
