import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingCart, Coffee, Car, Home, DollarSign, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SpendingInsightsProps {
  userId?: string;
  transactions?: any[];
}

interface CategoryData {
  name: string;
  spent: number;
  icon: JSX.Element;
  color: string;
  bgColor: string;
}

const CATEGORY_KEYWORDS: Record<string, { keywords: string[], icon: JSX.Element, color: string, bgColor: string }> = {
  "Food & Dining": {
    keywords: ["restaurant", "food", "coffee", "cafe", "dining", "lunch", "dinner", "breakfast", "starbucks", "mcdonald"],
    icon: <Coffee className="h-4 w-4" />,
    color: "#f97316",
    bgColor: "bg-orange-500"
  },
  "Shopping": {
    keywords: ["amazon", "shop", "store", "retail", "purchase", "buy", "mall", "walmart", "target"],
    icon: <ShoppingCart className="h-4 w-4" />,
    color: "#a855f7",
    bgColor: "bg-purple-500"
  },
  "Transportation": {
    keywords: ["uber", "lyft", "gas", "fuel", "parking", "transit", "train", "bus", "taxi", "car"],
    icon: <Car className="h-4 w-4" />,
    color: "#3b82f6",
    bgColor: "bg-blue-500"
  },
  "Bills & Utilities": {
    keywords: ["bill", "utility", "electric", "water", "internet", "phone", "subscription", "netflix", "spotify"],
    icon: <Home className="h-4 w-4" />,
    color: "#10b981",
    bgColor: "bg-green-500"
  },
  "Transfer": {
    keywords: ["transfer", "send", "payment"],
    icon: <DollarSign className="h-4 w-4" />,
    color: "#06b6d4",
    bgColor: "bg-cyan-500"
  }
};

export function SpendingInsights({ userId, transactions = [] }: SpendingInsightsProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);
  const [topCategory, setTopCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      console.log("SpendingInsights: Starting analysis for user:", userId);
      analyzeTransactions();
    } else {
      console.log("SpendingInsights: No userId provided");
      setLoading(false);
    }
  }, [userId, transactions]);

  const categorizeTransaction = (description: string, type: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Check each category's keywords
    for (const [category, { keywords }] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category;
      }
    }
    
    // Default categories based on type
    if (type === "transfer" || type === "withdrawal") return "Transfer";
    if (type === "deposit") return "Income";
    
    return "Other";
  };

  const analyzeTransactions = async () => {
    try {
      setLoading(true);
      console.log("Fetching transactions for user:", userId);
      
      // Fetch transactions for current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: currentMonthTxns, error: currentError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", firstDayOfMonth.toISOString())
        .in("type", ["withdrawal", "transfer", "payment"]);

      if (currentError) {
        console.error("Error fetching current month transactions:", currentError);
        setLoading(false);
        return;
      }

      console.log("Current month transactions:", currentMonthTxns?.length || 0);

      const { data: lastMonthTxns } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", lastMonth.toISOString())
        .lte("created_at", lastMonthEnd.toISOString())
        .in("type", ["withdrawal", "transfer", "payment"]);

      // Categorize and sum up spending
      const categoryMap = new Map<string, number>();
      
      currentMonthTxns?.forEach(txn => {
        const category = categorizeTransaction(txn.description || "", txn.type);
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Math.abs(Number(txn.amount)));
      });

      console.log("Categories found:", Array.from(categoryMap.keys()));

      // Calculate last month's total for comparison
      const lastMonthTotal = lastMonthTxns?.reduce((sum, txn) => sum + Math.abs(Number(txn.amount)), 0) || 0;
      const currentTotal = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      
      const change = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      setMonthlyChange(change);
      setTotalSpent(currentTotal);

      // Build categories array
      const categoriesData: CategoryData[] = [];
      categoryMap.forEach((spent, name) => {
        const categoryInfo = CATEGORY_KEYWORDS[name];
        if (categoryInfo && spent > 0) {
          categoriesData.push({
            name,
            spent,
            icon: categoryInfo.icon,
            color: categoryInfo.color,
            bgColor: categoryInfo.bgColor
          });
        }
      });

      // Sort by spending
      categoriesData.sort((a, b) => b.spent - a.spent);
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        setTopCategory(categoriesData[0].name);
      }

      console.log("Analysis complete. Categories:", categoriesData.length);

    } catch (error) {
      console.error("Error analyzing transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-24 sm:h-32 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Spending Insights</h3>
        </div>
        <div className="text-center py-6 sm:py-8 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <PieChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No spending data yet this month
          </p>
          <p className="text-xs text-muted-foreground">
            Start making transactions to see your spending breakdown
          </p>
        </div>
      </Card>
    );
  }

  // Prepare data for pie chart
  const chartData = categories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color
  }));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Total Spent</p>
            <p className="text-xl sm:text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {monthlyChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(monthlyChange).toFixed(1)}% vs last month</span>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Top Category</p>
            <p className="text-base sm:text-lg font-bold truncate">{topCategory}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              ${categories[0]?.spent.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Insights Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Spending Breakdown</h3>
        </div>

        {/* Pie Chart - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 -mx-2">
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                  padding: '8px'
                }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Category List - Mobile Optimized */}
        <div className="space-y-3">
          {categories.map((category, index) => {
            const percentage = (category.spent / totalSpent) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div style={{ color: category.color }}>
                        {category.icon}
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium truncate">{category.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold">${category.spent.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-1.5 sm:h-2"
                  style={{ 
                    backgroundColor: `${category.color}15`
                  }}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
