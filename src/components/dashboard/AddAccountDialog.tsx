import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, TrendingUp, CreditCard, Home, ArrowRight } from "lucide-react";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const accountTypes = [
  {
    type: "savings",
    icon: Wallet,
    title: "Savings Account",
    description: "Earn interest on your deposits",
    color: "from-green-500 to-green-600",
  },
  {
    type: "checking",
    icon: Wallet,
    title: "Checking Account",
    description: "For everyday transactions",
    color: "from-blue-500 to-blue-600",
  },
  {
    type: "investment",
    icon: TrendingUp,
    title: "Investment Account",
    description: "Grow your wealth over time",
    color: "from-pink-500 to-pink-600",
  },
  {
    type: "credit_card",
    icon: CreditCard,
    title: "Credit Card",
    description: "Flexible spending with rewards",
    color: "from-purple-500 to-purple-600",
  },
];

export function AddAccountDialog({ open, onOpenChange, userId, onSuccess }: AddAccountDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleAddAccount = async (accountType: string) => {
    setLoading(true);
    try {
      // Create account request for backend validation
      const { error: requestError } = await supabase.from("account_requests").insert({
        user_id: userId,
        account_type: accountType,
        status: "pending",
      });

      if (requestError) throw requestError;

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        message: `New account request: ${accountType.replace('_', ' ')} account`,
        is_read: false
      });

      toast.success(
        `${accountType.replace('_', ' ')} account request submitted! It will be reviewed and activated within 30 minutes.`
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating account request:", error);
      toast.error("Failed to create account request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Choose the type of account you want to add. Your account will be active in 30 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            return (
              <Card
                key={account.type}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => handleAddAccount(account.type)}
              >
                <div className={`bg-gradient-to-br ${account.color} p-6 text-white`}>
                  <Icon className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">{account.title}</h3>
                  <p className="text-sm opacity-90">{account.description}</p>
                </div>
                <div className="p-3 bg-card flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active in 30 min</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
