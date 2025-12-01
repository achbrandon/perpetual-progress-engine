import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DollarSign, Calendar, TrendingDown, Download } from "lucide-react";

export default function Loans() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchLoans(user.id);
  };

  const fetchLoans = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (outstanding: number, total: number) => {
    return ((total - outstanding) / total) * 100;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans & Mortgages</h1>
        <p className="text-muted-foreground">Manage your loans and apply for new ones</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_balance), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No loans found</p>
              <Button onClick={() => navigate("/bank/dashboard/loan-application")}>Apply for a Loan</Button>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const progress = calculateProgress(
              parseFloat(loan.outstanding_balance),
              parseFloat(loan.loan_amount)
            );
            
            return (
              <Card key={loan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{loan.loan_type}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Originated: {new Date(loan.origination_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={loan.loan_status === "active" ? "default" : "secondary"}>
                      {loan.loan_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Original Amount</p>
                      <p className="text-lg font-semibold">${parseFloat(loan.loan_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-lg font-semibold">${parseFloat(loan.outstanding_balance).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-semibold">{parseFloat(loan.interest_rate).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Payment</p>
                      <p className="text-lg font-semibold">${parseFloat(loan.monthly_payment).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Repayment Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Next Payment Due</p>
                      <p className="font-medium">{new Date(loan.next_due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Make Payment
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Statement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
