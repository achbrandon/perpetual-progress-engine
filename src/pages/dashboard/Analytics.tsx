import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { toast } from "sonner";

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("3months");
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalIncome: 0,
    avgTransaction: 0,
    transactionCount: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchTransactions();
    }
  }, [timeRange]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case "1month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3months":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTransactions(data || []);
      analyzeTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load analytics data");
    }
  };

  const analyzeTransactions = (data: any[]) => {
    // Calculate overall stats
    const credits = data
      .filter(t => t.type === 'credit' || t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const debits = data
      .filter(t => t.type === 'debit' || t.type === 'payment' || t.type === 'withdrawal' || t.type === 'fee')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    setStats({
      totalSpent: debits,
      totalIncome: credits,
      avgTransaction: data.length > 0 ? (credits + debits) / data.length : 0,
      transactionCount: data.length
    });

    // Analyze by category
    const categoryMap = new Map<string, number>();
    data
      .filter(t => t.type === 'debit' || t.type === 'payment' || t.type === 'withdrawal')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + parseFloat(t.amount));
      });

    const categoryChartData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories

    setCategoryData(categoryChartData);

    // Analyze by month
    const monthMap = new Map<string, { income: number, expenses: number }>();
    data.forEach(t => {
      const date = new Date(t.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (t.type === 'credit' || t.type === 'deposit') {
        existing.income += parseFloat(t.amount);
      } else {
        existing.expenses += parseFloat(t.amount);
      }
      
      monthMap.set(monthKey, existing);
    });

    const monthlyChartData = Array.from(monthMap.entries())
      .map(([month, values]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: values.income,
        expenses: values.expenses,
        net: values.income - values.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyData(monthlyChartData);

    // Analyze top merchants
    const merchantMap = new Map<string, number>();
    data
      .filter(t => t.merchant && (t.type === 'debit' || t.type === 'payment'))
      .forEach(t => {
        merchantMap.set(t.merchant, (merchantMap.get(t.merchant) || 0) + parseFloat(t.amount));
      });

    const topMerchantsData = Array.from(merchantMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setTopMerchants(topMerchantsData);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights into your spending patterns and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {transactions.filter(t => t.type === 'credit' || t.type === 'deposit').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {transactions.filter(t => t.type === 'debit' || t.type === 'payment' || t.type === 'withdrawal').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            {stats.totalIncome >= stats.totalSpent ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalIncome >= stats.totalSpent ? 'text-green-600' : 'text-red-600'}`}>
              ${(stats.totalIncome - stats.totalSpent).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalIncome >= stats.totalSpent ? 'Positive' : 'Negative'} cash flow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.avgTransaction.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">
            <Calendar className="h-4 w-4 mr-2" />
            Monthly Trends
          </TabsTrigger>
          <TabsTrigger value="categories">
            <TrendingUp className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="merchants">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Top Merchants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison of income and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No transaction data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Cash Flow</CardTitle>
              <CardDescription>Monthly net balance (Income - Expenses)</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="net" 
                      fill="#3b82f6"
                      name="Net Balance"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No transaction data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Distribution of expenses across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Top spending categories by amount</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="merchants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
              <CardDescription>Your most frequent spending destinations</CardDescription>
            </CardHeader>
            <CardContent>
              {topMerchants.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topMerchants}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`} />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-3">
                    {topMerchants.map((merchant, index) => (
                      <div key={merchant.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white`}
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{merchant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {transactions.filter(t => t.merchant === merchant.name).length} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${merchant.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No merchant data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
