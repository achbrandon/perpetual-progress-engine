import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Home,
  ChevronRight,
  Lock,
  Unlock
} from "lucide-react";

interface AccountCardProps {
  account: any;
  showBalance: boolean;
  onRefresh: () => void;
}

export function AccountCard({ account, showBalance, onRefresh }: AccountCardProps) {
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`bg-gradient-to-br ${getAccountColor(account.account_type)} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getAccountIcon(account.account_type)}
            <span className="text-sm font-medium capitalize">
              {account.account_type.replace('_', ' ')}
            </span>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {account.status}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold mb-1">{account.account_name}</h3>
        <p className="text-sm opacity-80 mb-4">{formatAccountNumber(account.account_number)}</p>

        <div className="space-y-2">
          <div>
            <p className="text-xs opacity-80">
              {isDebitAccount ? 'Balance' : 'Available Balance'}
            </p>
            <p className="text-2xl font-bold">
              {showBalance 
                ? `${isDebitAccount ? '-' : ''}$${parseFloat(account.available_balance || account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                : '••••••'}
            </p>
          </div>

          {account.account_type === 'credit_card' && (
            <div className="flex justify-between text-xs">
              <span className="opacity-80">Available Credit</span>
              <span className="font-medium">
                {showBalance ? `$${(parseFloat(account.available_balance) + parseFloat(account.balance)).toFixed(2)}` : '••••••'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-card">
        <Button 
          variant="ghost" 
          className="w-full justify-between text-sm"
          onClick={() => {
            // Credit cards show blocked info, route to cards page
            if (account.account_type === 'credit_card') {
              window.location.href = '/dashboard/cards';
            } else {
              window.location.href = `/dashboard/account-details?id=${account.id}`;
            }
          }}
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
