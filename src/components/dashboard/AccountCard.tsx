import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Home,
  ChevronRight,
  Lock,
  Unlock,
  UserPlus
} from "lucide-react";
import { AddJointHolderDialog } from "./AddJointHolderDialog";

interface AccountCardProps {
  account: any;
  showBalance: boolean;
  onRefresh: () => void;
}

export function AccountCard({ account, showBalance, onRefresh }: AccountCardProps) {
  const navigate = useNavigate();
  const [showJointDialog, setShowJointDialog] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousBalance = useRef(account.balance);
  
  // Trigger animation when balance changes
  useEffect(() => {
    if (previousBalance.current !== account.balance) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      previousBalance.current = account.balance;
      return () => clearTimeout(timer);
    }
  }, [account.balance]);
  
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
      case 'savings':
        return <Wallet className="h-6 w-6" />;
      case 'credit_card':
        return <CreditCard className="h-6 w-6" />;
      case 'loan':
        return <Home className="h-6 w-6" />;
      case 'investment':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <Wallet className="h-6 w-6" />;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking':
        return 'from-blue-500 to-blue-600';
      case 'savings':
        return 'from-green-500 to-green-600';
      case 'credit_card':
        return 'from-purple-500 to-purple-600';
      case 'loan':
        return 'from-orange-500 to-orange-600';
      case 'investment':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatAccountNumber = (number: string) => {
    if (number.length < 4) return number;
    return `****${number.slice(-4)}`;
  };

  const isDebitAccount = account.account_type === 'credit_card' || account.account_type === 'loan';

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-interactive h-full flex flex-col">
      <div className={`bg-gradient-to-br ${getAccountColor(account.account_type)} p-4 sm:p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {getAccountIcon(account.account_type)}
              </div>
              <span className="text-xs sm:text-sm font-medium capitalize">
                {account.account_type.replace('_', ' ')}
              </span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              {account.status}
            </Badge>
          </div>

          <h3 className="text-base sm:text-lg font-semibold mb-1 truncate">{account.account_name}</h3>
          <p className="text-xs sm:text-sm opacity-80 mb-3 sm:mb-4">{formatAccountNumber(account.account_number)}</p>

          <div className="space-y-1.5 sm:space-y-2">
            <div>
              <p className="text-xs opacity-80 mb-1">
                {isDebitAccount ? 'Balance' : 'Available Balance'}
              </p>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-all ${isAnimating ? 'animate-balance-update' : ''}`}>
                {showBalance 
                  ? `${isDebitAccount ? '-' : ''}$${parseFloat(account.available_balance || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                  : '••••••'}
              </p>
            </div>

            {account.account_type === 'credit_card' && (
              <div className="flex justify-between text-xs pt-2 border-t border-white/20">
                <span className="opacity-80">Available Credit</span>
                <span className="font-medium">
                  {showBalance ? `$${(parseFloat(account.available_balance) + parseFloat(account.balance)).toFixed(2)}` : '••••••'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-card mt-auto space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-between text-xs sm:text-sm mobile-button hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={() => {
            navigate(`/dashboard/account-details?id=${account.id}`);
          }}
        >
          View Details
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {(account.account_type === 'checking' || account.account_type === 'savings') && account.status === 'active' && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-xs sm:text-sm gap-2"
            onClick={() => setShowJointDialog(true)}
          >
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
            Add Joint Holder
          </Button>
        )}
      </div>

      <AddJointHolderDialog
        open={showJointDialog}
        onOpenChange={setShowJointDialog}
        account={account}
        onSuccess={onRefresh}
      />
    </Card>
  );
}
