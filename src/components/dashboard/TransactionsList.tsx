import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Filter,
  Download,
  AlertCircle,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Receipt
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { TransactionExportModal } from "./TransactionExportModal";

interface TransactionsListProps {
  transactions: any[];
  onRefresh: () => void;
}

export function TransactionsList({ transactions, onRefresh }: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        );
      case 'withdrawal':
      case 'debit':
        return (
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        );
      case 'transfer':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case 'payment':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case 'fee':
        return (
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
            <ArrowDownLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
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
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
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
          {filteredTransactions.map((transaction) => {
            // Clean up description by removing "Admin" prefix
            let cleanDescription = transaction.description;
            if (cleanDescription?.toLowerCase().startsWith('admin ')) {
              cleanDescription = cleanDescription.substring(6); // Remove "Admin " prefix
            }
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex items-center gap-4">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium capitalize">{cleanDescription}</p>
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
            );
          })}
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

      <TransactionExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
}
