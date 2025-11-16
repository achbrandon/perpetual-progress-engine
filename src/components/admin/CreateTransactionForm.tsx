import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Plus, 
  Wallet,
  ArrowUpRight,
  Smartphone,
  FileText,
  Bitcoin,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export function CreateTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [formData, setFormData] = useState({
    account_id: "",
    amount: "",
    type: "deposit",
    description: "",
    transaction_date: new Date(),
    completion_type: "instant",
  });

  const transactionTypes = [
    { value: "deposit", label: "Deposit", icon: Wallet, transactionType: "credit" },
    { value: "withdraw", label: "Withdraw", icon: ArrowUpRight, transactionType: "debit" },
    { value: "mobile_deposit", label: "Mobile Deposit", icon: Smartphone, transactionType: "credit" },
    { value: "check", label: "Check", icon: FileText, transactionType: "credit" },
    { value: "bitcoin_deposit", label: "Bitcoin Deposit", icon: Bitcoin, transactionType: "credit" },
    { value: "bitcoin_withdraw", label: "Bitcoin Withdraw", icon: Bitcoin, transactionType: "debit" },
    { value: "credit_card_payment", label: "Credit Card Payment", icon: CreditCard, transactionType: "debit" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAccounts(selectedUser);
    } else {
      setAccounts([]);
      setFormData(prev => ({ ...prev, account_id: "" }));
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    
    if (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      return;
    }
    
    setUsers(data || []);
  };

  const fetchUserAccounts = async (userId: string) => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");
    
    if (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load user accounts");
      return;
    }
    
    setAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedUser || !formData.account_id || !formData.amount) {
        toast.error("Please fill in all required fields");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Get the selected transaction type info
      const selectedType = transactionTypes.find(t => t.value === formData.type);
      if (!selectedType) {
        toast.error("Invalid transaction type");
        return;
      }

      // Calculate auto-complete time if delayed
      let autoCompleteAt = null;
      let status = "completed";
      
      if (formData.completion_type === "delayed") {
        autoCompleteAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        status = "pending";
      }

      // Get the account to update balance
      const { data: account } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", formData.account_id)
        .single();

      if (!account) {
        toast.error("Account not found");
        return;
      }

      const currentBalance = account.balance || 0;
      const adjustment = selectedType.transactionType === "credit" ? amount : -amount;
      const newBalance = currentBalance + adjustment;

      if (newBalance < 0) {
        toast.error("Transaction would result in negative balance");
        return;
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: selectedUser,
          account_id: formData.account_id,
          amount: amount,
          type: selectedType.transactionType,
          description: formData.description || `Admin ${selectedType.label}`,
          status: status,
          created_at: formData.transaction_date.toISOString(),
          auto_complete_at: autoCompleteAt ? autoCompleteAt.toISOString() : null,
        });

      if (transactionError) throw transactionError;

      // Update account balance if instant
      if (formData.completion_type === "instant") {
        const { error: balanceError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", formData.account_id);

        if (balanceError) throw balanceError;

        // Send notification to user
        const accountData = await supabase
          .from("accounts")
          .select("account_number")
          .eq("id", formData.account_id)
          .single();

        if (accountData.data) {
          if (selectedType.transactionType === "credit") {
            const notification = NotificationTemplates.depositReceived(
              amount,
              accountData.data.account_number
            );
            await createNotification({
              userId: selectedUser,
              ...notification,
            });
          } else if (selectedType.transactionType === "debit") {
            const notification = NotificationTemplates.withdrawalProcessed(amount);
            await createNotification({
              userId: selectedUser,
              ...notification,
            });
          }
        }
      }

      toast.success(
        formData.completion_type === "instant"
          ? "Transaction completed successfully"
          : "Transaction scheduled - will complete in 30 minutes"
      );

      // Reset form
      setSelectedUser("");
      setFormData({
        account_id: "",
        amount: "",
        type: "deposit",
        description: "",
        transaction_date: new Date(),
        completion_type: "instant",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast.error(error.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">Create Transaction</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="user">Select User *</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="account">Select Account *</Label>
          <Select
            value={formData.account_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}
            disabled={!selectedUser || accounts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={!selectedUser ? "Select user first" : "Choose an account"} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_type} - {account.account_number} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Transaction Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="completion">Completion Type *</Label>
          <Select
            value={formData.completion_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, completion_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant (Complete Now)</SelectItem>
              <SelectItem value="delayed">Delayed (Complete in 30 minutes)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Transaction Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.transaction_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.transaction_date ? format(formData.transaction_date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.transaction_date}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, transaction_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="description">Description / Reason</Label>
          <Textarea
            id="description"
            placeholder="Enter reason for transaction..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Transaction"}
        </Button>
      </form>
    </Card>
  );
}
