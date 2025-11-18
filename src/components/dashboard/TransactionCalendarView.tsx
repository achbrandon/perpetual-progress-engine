import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { SwipeableTransactionCard } from "./SwipeableTransactionCard";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransactionCalendarViewProps {
  transactions: any[];
  onRefresh: () => void;
}

// Transaction calendar view component

export function TransactionCalendarView({
  transactions,
  onRefresh,
}: TransactionCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch favorites
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorite_transactions')
      .select('transaction_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(new Set(data.map(f => f.transaction_id)));
    }
  };

  const handleFavoriteChange = async (transactionId: string, isFavorite: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isFavorite) {
      const { error } = await supabase
        .from('favorite_transactions')
        .insert({ user_id: user.id, transaction_id: transactionId });

      if (!error) {
        setFavorites(prev => new Set([...prev, transactionId]));
        toast.success('Added to favorites');
      }
    } else {
      const { error } = await supabase
        .from('favorite_transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('transaction_id', transactionId);

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
        toast.success('Removed from favorites');
      }
    }
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Group transactions by date
  const transactionsByDate = transactions.reduce((acc, transaction) => {
    const date = format(new Date(transaction.created_at), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, any[]>);

  // Get transactions for selected date
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateTransactions = transactionsByDate[selectedDateKey] || [];

  // Calculate totals for selected date
  const selectedDateTotals = selectedDateTransactions.reduce(
    (acc, t) => {
      if (t.type === "deposit" || t.type === "credit") {
        acc.income += parseFloat(t.amount);
      } else {
        acc.expense += parseFloat(t.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Get dates with transactions in current month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const datesWithTransactions = daysInMonth.filter((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return transactionsByDate[dateKey]?.length > 0;
  });

  // Custom day content to show transaction indicators
  const modifiers = {
    hasTransactions: datesWithTransactions,
  };

  const modifiersClassNames = {
    hasTransactions: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
  };

  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Transaction Calendar</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month View
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Section */}
        <Card className="p-4 lg:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className={cn("rounded-md border-0 pointer-events-auto")}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
            }}
          />

          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dates with activity</span>
              <Badge variant="secondary">{datesWithTransactions.length}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Click on a date to view transactions
            </div>
          </div>
        </Card>

        {/* Transactions for Selected Date */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <h3 className="font-semibold">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDateTransactions.length} transaction{selectedDateTransactions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Daily Summary */}
          {selectedDateTransactions.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <ArrowDownCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedDateTotals.income.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <ArrowUpCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    ${selectedDateTotals.expense.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {selectedDateTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No transactions on this date</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a different date or check the highlighted dates
                </p>
              </div>
            ) : (
              selectedDateTransactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <SwipeableTransactionCard
                    transaction={transaction}
                    isFavorite={favorites.has(transaction.id)}
                    onFavoriteChange={() => handleFavoriteChange(transaction.id, !favorites.has(transaction.id))}
                    onClick={() => handleTransactionClick(transaction)}
                  />
                  {index < selectedDateTransactions.length - 1 && (
                    <div className="border-b my-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Timeline View */}
      {viewMode === "month" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">
            Monthly Timeline - {format(selectedDate, "MMMM yyyy")}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {datesWithTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions this month
              </div>
            ) : (
              datesWithTransactions.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const dayTransactions = transactionsByDate[dateKey];
                const dayTotal = dayTransactions.reduce(
                  (sum, t) => sum + parseFloat(t.amount),
                  0
                );

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:border-primary hover:shadow-sm",
                      isSameDay(date, selectedDate) && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {format(date, "d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(date, "EEE")}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">
                          {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(date, "MMMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={dayTotal >= 0 ? "default" : "destructive"}>
                        ${Math.abs(dayTotal).toFixed(2)}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}
