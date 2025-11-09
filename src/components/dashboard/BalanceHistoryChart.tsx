import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BalanceDataPoint {
  date: string;
  balance: number;
  timestamp: number;
  hasAdminTransaction?: boolean;
  hasUserTransaction?: boolean;
}

interface Account {
  id: string;
  account_type: string;
  account_number: string;
}

type DateRange = '7' | '30' | '90' | 'all';

export const BalanceHistoryChart = () => {
  const [chartData, setChartData] = useState<BalanceDataPoint[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchBalanceHistory();
    }
  }, [selectedAccount, dateRange, accounts]);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("accounts")
      .select("id, account_type, account_number")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (data) {
      setAccounts(data);
    }
  };

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case '7':
        const date7 = new Date();
        date7.setDate(date7.getDate() - 7);
        return date7;
      case '30':
        const date30 = new Date();
        date30.setDate(date30.getDate() - 30);
        return date30;
      case '90':
        const date90 = new Date();
        date90.setDate(date90.getDate() - 90);
        return date90;
      case 'all':
      default:
        return new Date(0); // Beginning of time
    }
  };

  const fetchBalanceHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const dateRangeStart = getDateRangeStart();
      
      // First, get all transactions before the date range to calculate starting balance
      const { data: previousTransactions } = await supabase
        .from("transactions")
        .select("amount, type, account_id, description")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .lt("created_at", dateRangeStart.toISOString());

      // Calculate starting balance from previous transactions
      let startingBalance = 0;
      if (previousTransactions) {
        previousTransactions.forEach((transaction) => {
          // Only count if filtering by specific account or all accounts
          if (selectedAccount === "all" || transaction.account_id === selectedAccount) {
            if (transaction.type === "credit") {
              startingBalance += parseFloat(String(transaction.amount));
            } else {
              startingBalance -= parseFloat(String(transaction.amount));
            }
          }
        });
      }
      
      // Now get transactions in the selected date range
      let query = supabase
        .from("transactions")
        .select("amount, type, created_at, account_id, description")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", dateRangeStart.toISOString())
        .order("created_at", { ascending: true });

      if (selectedAccount !== "all") {
        query = query.eq("account_id", selectedAccount);
      }

      const { data: transactions } = await query;

      if (transactions && transactions.length > 0) {
        // Calculate running balance starting from the starting balance
        let runningBalance = startingBalance;
        const balancePoints: BalanceDataPoint[] = [];
        const dailyTransactions: Record<string, { admin: boolean; user: boolean }> = {};

        transactions.forEach((transaction) => {
          if (transaction.type === "credit") {
            runningBalance += parseFloat(String(transaction.amount));
          } else {
            runningBalance -= parseFloat(String(transaction.amount));
          }

          const dateKey = new Date(transaction.created_at).toLocaleDateString();
          const isAdminTransaction = transaction.description?.toLowerCase().includes('admin') || false;

          // Track which types of transactions occurred on this date
          if (!dailyTransactions[dateKey]) {
            dailyTransactions[dateKey] = { admin: false, user: false };
          }
          if (isAdminTransaction) {
            dailyTransactions[dateKey].admin = true;
          } else {
            dailyTransactions[dateKey].user = true;
          }

          balancePoints.push({
            date: dateKey,
            balance: runningBalance,
            timestamp: new Date(transaction.created_at).getTime(),
          });
        });

        // Group by date and take the last balance of each day, adding transaction type markers
        const groupedByDate = balancePoints.reduce((acc, point) => {
          if (!acc[point.date] || point.timestamp > acc[point.date].timestamp) {
            acc[point.date] = {
              ...point,
              hasAdminTransaction: dailyTransactions[point.date]?.admin || false,
              hasUserTransaction: dailyTransactions[point.date]?.user || false,
            };
          }
          return acc;
        }, {} as Record<string, BalanceDataPoint>);

        setChartData(Object.values(groupedByDate));
      } else {
        // If no transactions in range, show starting balance if it exists
        if (startingBalance !== 0) {
          setChartData([{
            date: dateRangeStart.toLocaleDateString(),
            balance: startingBalance,
            timestamp: dateRangeStart.getTime(),
          }]);
        } else {
          setChartData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching balance history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Balance History</CardTitle>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_type} - {account.account_number.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={dateRange === '7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateRange === '30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30')}
            >
              Last 30 Days
            </Button>
            <Button
              variant={dateRange === '90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90')}
            >
              Last 90 Days
            </Button>
            <Button
              variant={dateRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('all')}
            >
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No transaction history available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold mb-1">{data.date}</p>
                        <p className="text-primary mb-2">{formatCurrency(data.balance)}</p>
                        {data.hasAdminTransaction && (
                          <div className="flex items-center gap-1 text-xs text-orange-500">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Admin Transaction
                          </div>
                        )}
                        {data.hasUserTransaction && (
                          <div className="flex items-center gap-1 text-xs text-green-500">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            User Transaction
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                content={() => (
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span>Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>User Transaction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Admin Transaction</span>
                    </div>
                  </div>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hasAdminTransaction && payload.hasUserTransaction) {
                    // Both types on same day - show split dot
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <circle cx={cx - 2} cy={cy} r={2} fill="#22c55e" />
                        <circle cx={cx + 2} cy={cy} r={2} fill="#f97316" />
                      </g>
                    );
                  } else if (payload.hasAdminTransaction) {
                    return <circle cx={cx} cy={cy} r={5} fill="#f97316" stroke="hsl(var(--primary))" strokeWidth={2} />;
                  } else if (payload.hasUserTransaction) {
                    return <circle cx={cx} cy={cy} r={5} fill="#22c55e" stroke="hsl(var(--primary))" strokeWidth={2} />;
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />;
                }}
                activeDot={{ r: 8 }}
                name="Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
