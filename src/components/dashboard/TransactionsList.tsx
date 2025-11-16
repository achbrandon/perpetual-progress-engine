import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Download,
  AlertCircle,
  Heart,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  CreditCard,
  ArrowUpDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { TransactionExportModal } from "./TransactionExportModal";
import { SwipeableTransactionCard } from "./SwipeableTransactionCard";
import { TransactionsStatsSummary } from "./TransactionsStatsSummary";

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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");

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

  // Transaction type filters configuration
  const transactionTypeFilters = [
    { type: 'deposit', label: 'Deposits', icon: ArrowDownCircle, color: 'text-green-600' },
    { type: 'withdrawal', label: 'Withdrawals', icon: ArrowUpCircle, color: 'text-red-600' },
    { type: 'transfer', label: 'Transfers', icon: ArrowLeftRight, color: 'text-blue-600' },
    { type: 'payment', label: 'Payments', icon: CreditCard, color: 'text-purple-600' },
  ];

  const toggleTypeFilter = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setShowFavoritesOnly(false);
    setSearchQuery("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleMinAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setMinAmount(value);
    }
  };

  const handleMaxAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setMaxAmount(value);
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      // Search filter
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.merchant?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Favorites filter
      const matchesFavorites = showFavoritesOnly ? favorites.has(t.id) : true;
      
      // Type filter - map credit/debit to deposit/withdrawal for filtering
      let transactionType = t.type;
      if (t.type === 'credit') transactionType = 'deposit';
      if (t.type === 'debit') transactionType = 'withdrawal';
      
      const matchesType = selectedTypes.size === 0 || selectedTypes.has(transactionType);
      
      // Amount range filter
      const amount = Math.abs(parseFloat(t.amount));
      const min = minAmount ? parseFloat(minAmount) : 0;
      const max = maxAmount ? parseFloat(maxAmount) : Infinity;
      const matchesAmount = amount >= min && amount <= max;
      
      return matchesSearch && matchesFavorites && matchesType && matchesAmount;
    })
    .sort((a, b) => {
      // Sort favorites to the top when filter is off (only for date sorting)
      if (!showFavoritesOnly && (sortBy === "date-desc" || sortBy === "date-asc")) {
        const aIsFav = favorites.has(a.id);
        const bIsFav = favorites.has(b.id);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
      }
      
      // Apply selected sort
      switch (sortBy) {
        case "amount-asc":
          return Math.abs(parseFloat(a.amount)) - Math.abs(parseFloat(b.amount));
        case "amount-desc":
          return Math.abs(parseFloat(b.amount)) - Math.abs(parseFloat(a.amount));
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "date-desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const favoriteCount = transactions.filter(t => favorites.has(t.id)).length;
  const activeFiltersCount = selectedTypes.size + (showFavoritesOnly ? 1 : 0) + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0);

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <>
      {/* Statistics Summary */}
      {filteredTransactions.length > 0 && (
        <TransactionsStatsSummary transactions={filteredTransactions} />
      )}

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
          {/* Sort selector */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
          
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

      {/* Transaction Type Filter Chips */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {transactionTypeFilters.map(({ type, label, icon: Icon, color }) => {
            const isActive = selectedTypes.has(type);
            return (
              <Badge
                key={type}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  isActive ? 'shadow-md' : ''
                }`}
                onClick={() => toggleTypeFilter(type)}
              >
                <Icon className={`h-3 w-3 mr-1 ${isActive ? '' : color}`} />
                {label}
              </Badge>
            );
          })}
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs"
            >
              Clear all ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Amount Range Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Amount:</span>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => handleMinAmountChange(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => handleMaxAmountChange(e.target.value)}
              className="w-24 h-8 text-sm"
            />
          </div>
          {(minAmount || maxAmount) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMinAmount("");
                setMaxAmount("");
              }}
              className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters indicator */}
      {activeFiltersCount > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            Showing <span className="font-medium text-foreground">{filteredTransactions.length}</span> filtered transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {showFavoritesOnly && <span className="ml-1">(favorites only)</span>}
            {minAmount && <span className="ml-1">(min: ${minAmount})</span>}
            {maxAmount && <span className="ml-1">(max: ${maxAmount})</span>}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
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
            No transactions found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeFiltersCount > 0
              ? "Try adjusting your filters"
              : searchQuery 
                ? "Try adjusting your search" 
                : "Your transactions will appear here"
            }
          </p>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-2"
            >
              Clear All Filters
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
