import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Filter,
  Download,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDetailsModal } from "./TransactionDetailsModal";

interface TransactionsListProps {
  transactions: any[];
  onRefresh: () => void;
}

export function TransactionsList({ transactions, onRefresh }: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions'
        },
        () => {
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  const getTransactionIcon = (type: string) => {
    const isDebit = type === 'debit' || type === 'payment' || type === 'withdrawal' || type === 'fee';
    return isDebit ? (
      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
    ) : (
      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
        <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      disputed: "outline"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <>
      <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recent Transactions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No transactions found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Your transactions will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleTransactionClick(transaction)}
            >
              <div className="flex items-center gap-4">
                {getTransactionIcon(transaction.type)}
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {transaction.category && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground capitalize">
                          {transaction.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'credit' || transaction.type === 'deposit'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'credit' || transaction.type === 'deposit' ? '+' : '-'}
                  ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                </p>
                <div className="mt-1">
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
      />
    </>
  );
}
