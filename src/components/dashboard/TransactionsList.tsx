import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Filter,
  Download,
  AlertCircle,
  Heart,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { TransactionExportModal } from "./TransactionExportModal";
import { SwipeableTransactionCard } from "./SwipeableTransactionCard";

interface TransactionsListProps {
  transactions: any[];
  onRefresh: () => void;
}

export function TransactionsList({ transactions, onRefresh }: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch favorites
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

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
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

  // Subscribe to real-time favorites updates
  useEffect(() => {
    const channel = supabase
      .channel('favorites-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorite_transactions'
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      // Search filter
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.merchant?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Favorites filter
      const matchesFavorites = showFavoritesOnly ? favorites.has(t.id) : true;
      
      return matchesSearch && matchesFavorites;
    })
    .sort((a, b) => {
      // Sort favorites to the top when filter is off
      if (!showFavoritesOnly) {
        const aIsFav = favorites.has(a.id);
        const bIsFav = favorites.has(b.id);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
      }
      return 0; // Keep original order for same favorite status
    });

  const favoriteCount = transactions.filter(t => favorites.has(t.id)).length;

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <>
      <Card className="mobile-card-padding animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Transactions</h2>
          {favoriteCount > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex items-center gap-1">
              <Heart className="h-3 w-3 fill-current" />
              {favoriteCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Favorites filter toggle */}
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`transition-all ${showFavoritesOnly ? 'shadow-md' : ''}`}
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">
              {showFavoritesOnly ? 'Show All' : 'Favorites'}
            </span>
            {showFavoritesOnly && favoriteCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary-foreground/20">
                {filteredTransactions.length}
              </Badge>
            )}
          </Button>
          
          <Button variant="outline" size="sm" className="sm:hidden" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active filters indicator */}
      {showFavoritesOnly && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
          <Heart className="h-4 w-4 text-primary fill-current shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            Showing <span className="font-medium text-foreground">{filteredTransactions.length}</span> favorited transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFavoritesOnly(false)}
            className="h-7 px-2 hover:bg-primary/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11"
          />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 sm:py-12 animate-fade-in">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            {showFavoritesOnly ? 'No favorite transactions' : 'No transactions found'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {showFavoritesOnly 
              ? "Swipe right on transactions to add them to favorites"
              : searchQuery 
                ? "Try adjusting your search" 
                : "Your transactions will appear here"
            }
          </p>
          {showFavoritesOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFavoritesOnly(false)}
              className="mt-2"
            >
              Show All Transactions
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Favorites section header when not filtering */}
          {!showFavoritesOnly && favoriteCount > 0 && filteredTransactions.some(t => favorites.has(t.id)) && (
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-current" />
              <span className="text-sm font-medium text-muted-foreground">
                Favorites First
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          
          <div className="space-y-2 sm:space-y-3">
            {filteredTransactions.map((transaction, index) => {
              const isFavorite = favorites.has(transaction.id);
              const prevTransaction = filteredTransactions[index - 1];
              const prevIsFavorite = prevTransaction ? favorites.has(prevTransaction.id) : false;
              
              // Show divider when transitioning from favorites to non-favorites
              const showDivider = !showFavoritesOnly && isFavorite === false && prevIsFavorite === true;
              
              return (
                <div key={transaction.id}>
                  {showDivider && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">Other Transactions</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <SwipeableTransactionCard
                    transaction={transaction}
                    isFavorite={isFavorite}
                    onFavoriteChange={fetchFavorites}
                    onClick={() => handleTransactionClick(transaction)}
                  />
                </div>
              );
            })}
          </div>
        </>
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
