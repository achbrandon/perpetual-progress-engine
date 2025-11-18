import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsList } from "@/components/dashboard/TransactionsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 50;

  const fetchTransactions = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (append) {
          setTransactions(prev => [...prev, ...data]);
        } else {
          setTransactions(data);
        }
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(0);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchTransactions(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">
              View all your transactions across all accounts
            </p>
          </div>
        </div>
      </div>

      <TransactionsList 
        transactions={transactions} 
        onRefresh={handleRefresh}
      />

      {hasMore && transactions.length > 0 && (
        <div className="flex justify-center py-8">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Transactions'
            )}
          </Button>
        </div>
      )}

      {!hasMore && transactions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end of your transaction history
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
