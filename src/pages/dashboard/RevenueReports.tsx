import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

const RevenueReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch transactions from last 12 months
      const twelveMonthsAgo = subMonths(new Date(), 12);
      
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", twelveMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group transactions by month
      const monthlyMap = new Map<string, { income: number; expenses: number }>();
      
      transactions?.forEach(transaction => {
        const monthKey = format(parseISO(transaction.created_at), 'MMM yyyy');
        const existing = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
        
        if (transaction.type === 'deposit') {
          existing.income += Number(transaction.amount);
        } else if (transaction.type === 'payment' || transaction.type === 'withdrawal') {
          existing.expenses += Number(transaction.amount);
        }
        
        monthlyMap.set(monthKey, existing);
      });

      // Convert to array and calculate profit
      const data: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([month, values]) => ({
          month,
          income: values.income,
          expenses: values.expenses,
          profit: values.income - values.expenses
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      setMonthlyData(data);

      // Calculate totals
      const income = data.reduce((sum, item) => sum + item.income, 0);
      const expenses = data.reduce((sum, item) => sum + item.expenses, 0);
      
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setNetProfit(income - expenses);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading revenue reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Revenue Reports</h1>
            <p className="text-muted-foreground">Monthly income and expense analysis</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 12 months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 12 months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Income minus expenses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
            <CardDescription>Compare your income and expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(142, 76%, 36%)" name="Income" />
                <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>Track your net profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                  name="Net Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Detailed monthly financial summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Month</th>
                    <th className="text-right p-4 font-medium">Income</th>
                    <th className="text-right p-4 font-medium">Expenses</th>
                    <th className="text-right p-4 font-medium">Profit</th>
                    <th className="text-right p-4 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, index) => {
                    const profitMargin = item.income > 0 
                      ? ((item.profit / item.income) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-4">{item.month}</td>
                        <td className="text-right p-4 text-green-600 font-medium">
                          {formatCurrency(item.income)}
                        </td>
                        <td className="text-right p-4 text-red-600 font-medium">
                          {formatCurrency(item.expenses)}
                        </td>
                        <td className={`text-right p-4 font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.profit)}
                        </td>
                        <td className={`text-right p-4 ${Number(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitMargin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="font-bold border-t-2">
                  <tr>
                    <td className="p-4">Total</td>
                    <td className="text-right p-4 text-green-600">
                      {formatCurrency(totalIncome)}
                    </td>
                    <td className="text-right p-4 text-red-600">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td className={`text-right p-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td className={`text-right p-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueReports;
