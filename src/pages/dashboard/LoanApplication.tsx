import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, AlertTriangle } from "lucide-react";

export default function LoanApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loanData, setLoanData] = useState({
    amount: "",
    purpose: "",
    term: "60"
  });
  const [calculatedData, setCalculatedData] = useState({
    monthlyPayment: 0,
    totalInterest: 0,
    totalAmount: 0,
    interestRate: 5.5
  });

  const calculateLoan = (amount: number, termMonths: number, rate: number) => {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalAmount = monthlyPayment * termMonths;
    const totalInterest = totalAmount - amount;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      interestRate: rate
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(loanData.amount);
    const term = parseInt(loanData.term);
    
    if (amount < 1000) {
      toast.error("Minimum loan amount is $1,000");
      return;
    }

    if (!loanData.purpose.trim()) {
      toast.error("Please provide a reason for the loan");
      return;
    }

    const calculated = calculateLoan(amount, term, 5.5);
    setCalculatedData(calculated);
    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/bank/login");
        return;
      }

      const { error } = await supabase.from("loan_applications").insert({
        user_id: user.id,
        loan_type: loanData.purpose,
        amount: parseFloat(loanData.amount),
        total_interest: calculatedData.totalInterest,
        status: "pending"
      });

      if (error) throw error;

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "loan_application",
        message: `New loan application: $${parseFloat(loanData.amount).toLocaleString()} for ${loanData.purpose.substring(0, 30)}`,
        user_id: user.id
      });

      // Get user's first active account for transaction record
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (accounts && accounts.length > 0) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accounts[0].id,
          type: "credit",
          amount: parseFloat(loanData.amount),
          description: `Loan Application - ${loanData.purpose.substring(0, 50)}`,
          status: "pending"
        } as any);
      }

      toast.success("Loan application submitted successfully!");
      setShowTerms(false);
      navigate("/bank/dashboard/loans");
    } catch (error: any) {
      console.error("Error submitting loan application:", error);
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply for a Loan</h1>
        <p className="text-muted-foreground">Get the funds you need with competitive rates</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Loan Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="100"
                min="1000"
                placeholder="Enter amount (minimum $1,000)"
                value={loanData.amount}
                onChange={(e) => setLoanData({ ...loanData, amount: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground">Minimum: $1,000 | Maximum: $500,000</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Loan Term</Label>
              <Select value={loanData.term} onValueChange={(value) => setLoanData({ ...loanData, term: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months (1 year)</SelectItem>
                  <SelectItem value="24">24 months (2 years)</SelectItem>
                  <SelectItem value="36">36 months (3 years)</SelectItem>
                  <SelectItem value="48">48 months (4 years)</SelectItem>
                  <SelectItem value="60">60 months (5 years)</SelectItem>
                  <SelectItem value="120">120 months (10 years)</SelectItem>
                  <SelectItem value="180">180 months (15 years)</SelectItem>
                  <SelectItem value="240">240 months (20 years)</SelectItem>
                  <SelectItem value="360">360 months (30 years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Loan</Label>
              <Textarea
                id="purpose"
                placeholder="Please describe why you need this loan and how you plan to use it"
                value={loanData.purpose}
                onChange={(e) => setLoanData({ ...loanData, purpose: e.target.value })}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continue to Terms & Conditions
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Loan Terms & Conditions
            </DialogTitle>
            <DialogDescription>
              Please review the loan details and terms before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-2xl font-bold">${parseFloat(loanData.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-2xl font-bold">{calculatedData.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Term</p>
                    <p className="text-2xl font-bold">{loanData.term} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-2xl font-bold text-primary">${calculatedData.monthlyPayment.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-lg font-semibold text-red-600">${calculatedData.totalInterest.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Total Amount to Repay</p>
                    <p className="text-xl font-bold">${calculatedData.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 text-sm">
              <h4 className="font-semibold text-base">Important Terms & Conditions:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>You agree to repay the loan amount plus interest over the specified term</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Late payment fees of $50 will be charged for payments more than 15 days overdue</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Early repayment is allowed without penalty fees</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>The interest rate is fixed and will not change during the loan term</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Your application will be reviewed within 2-3 business days</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Approval is subject to credit verification and income assessment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Failure to repay may result in negative impact to your credit score</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Collateral may be required for loans above $50,000</span>
                </li>
              </ul>
            </div>

            <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <strong>Warning:</strong> Borrowing money costs money. Make sure you can afford the monthly 
                  payments before proceeding. By accepting these terms, you acknowledge that you have read 
                  and understood all conditions.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTerms(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAcceptTerms} disabled={loading}>
              {loading ? "Submitting..." : "Accept Terms & Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}