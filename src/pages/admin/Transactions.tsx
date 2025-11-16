import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, TrendingUp, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CreateTransactionForm } from "@/components/admin/CreateTransactionForm";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const transactionsChannel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, transfersRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, accounts(account_name, account_number), profiles(full_name, email)")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("transfers")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (transfersRes.data) setTransfers(transfersRes.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (transaction: any) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", transaction.id);

      if (error) throw error;

      // Send notification to user
      const notification = NotificationTemplates.transactionCompleted(
        Math.abs(transaction.amount),
        transaction.description || transaction.type
      );
      await createNotification({
        userId: transaction.user_id,
        ...notification,
      });

      toast.success("Transaction approved successfully");
      fetchData();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  const handleRejectTransaction = async (transaction: any) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);

      if (error) throw error;

      // Send notification to user
      const notification = NotificationTemplates.transactionRejected(
        Math.abs(transaction.amount),
        transaction.type
      );
      await createNotification({
        userId: transaction.user_id,
        ...notification,
      });

      toast.success("Transaction rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  const handleApproveTransfer = async (transfer: any) => {
    try {
      // Get account details for the notification
      const { data: fromAccount } = await supabase
        .from("accounts")
        .select("account_type, balance")
        .eq("id", transfer.from_account)
        .single();

      const { data: toAccount } = await supabase
        .from("accounts")
        .select("account_type, balance")
        .eq("id", transfer.to_account)
        .single();

      // Update balances if internal transfer
      if (fromAccount && toAccount) {
        const fromBalance = parseFloat(String(fromAccount.balance || 0));
        const toBalance = parseFloat(String(toAccount.balance || 0));
        const newFromBalance = fromBalance - transfer.amount;
        const newToBalance = toBalance + transfer.amount;

        await Promise.all([
          supabase
            .from("accounts")
            .update({ balance: newFromBalance })
            .eq("id", transfer.from_account),
          supabase
            .from("accounts")
            .update({ balance: newToBalance })
            .eq("id", transfer.to_account)
        ]);
      }

      // Update transfer status
      const { error } = await supabase
        .from("transfers")
        .update({ 
          status: "completed",
          completed_date: new Date().toISOString()
        })
        .eq("id", transfer.id);

      if (error) throw error;

      // Update related transactions
      await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("user_id", transfer.user_id)
        .eq("created_at", transfer.created_at)
        .eq("status", "pending");

      // Send notification to user
      await createNotification({
        userId: transfer.user_id,
        title: "Transfer Approved",
        message: `Your transfer of $${transfer.amount.toFixed(2)} has been approved and completed successfully`,
        type: "success"
      });

      toast.success("Transfer approved successfully");
      fetchData();
    } catch (error) {
      console.error("Error approving transfer:", error);
      toast.error("Failed to approve transfer");
    }
  };

  const handleRejectTransfer = async (transfer: any, reason?: string) => {
    try {
      // Update transfer status
      const { error } = await supabase
        .from("transfers")
        .update({ status: "failed" })
        .eq("id", transfer.id);

      if (error) throw error;

      // Update related transactions
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("user_id", transfer.user_id)
        .eq("created_at", transfer.created_at)
        .eq("status", "pending");

      // Send notification to user with reason
      const rejectionMessage = reason 
        ? `Your transfer of $${transfer.amount.toFixed(2)} was rejected. Reason: ${reason}`
        : `Your transfer of $${transfer.amount.toFixed(2)} was rejected. Please contact support for more information`;

      await createNotification({
        userId: transfer.user_id,
        title: "Transfer Rejected",
        message: rejectionMessage,
        type: "error"
      });

      toast.success("Transfer rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      toast.error("Failed to reject transfer");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Transaction Management</h1>
        <p className="text-slate-300">Create transactions and manage pending approvals</p>
      </div>

      <CreateTransactionForm onSuccess={fetchData} />

      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="crypto">
            <TrendingUp className="h-4 w-4 mr-2" />
            Crypto Transactions ({transactions.filter(t => t.category === "Crypto").length})
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <CreditCard className="h-4 w-4 mr-2" />
            Transfers ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Pending ({transactions.length + transfers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crypto" className="space-y-4 mt-6">
          {transactions.filter(t => t.category === "Crypto").length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg py-12 text-center text-slate-400">
              No pending crypto transactions
            </div>
          ) : (
            transactions.filter(t => t.category === "Crypto").map((transaction) => (
              <div key={transaction.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    {transaction.transaction_type === 'credit' ? 'Crypto Deposit' : 'Crypto Withdrawal'} Pending
                  </h3>
                  <Badge variant="secondary">
                    {new Date(transaction.created_at).toLocaleString()}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">User</p>
                      <p className="text-white font-medium">{transaction.profiles?.full_name}</p>
                      <p className="text-slate-400 text-xs">{transaction.profiles?.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Amount</p>
                      <p className="text-white font-bold text-xl">${parseFloat(transaction.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Account</p>
                      <p className="text-white">{transaction.accounts?.account_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Type</p>
                      <p className="text-white capitalize">{transaction.transaction_type === 'credit' ? 'Deposit' : 'Withdrawal'}</p>
                    </div>
                    {transaction.crypto_currency && (
                      <div>
                        <p className="text-slate-400">Crypto Currency</p>
                        <p className="text-white font-medium">{transaction.crypto_currency}</p>
                      </div>
                    )}
                    {transaction.destination_wallet_address && (
                      <div className="col-span-2">
                        <p className="text-slate-400 mb-2">Destination Wallet Address</p>
                        <p className="text-white text-xs font-mono break-all bg-slate-900/50 p-3 rounded border border-slate-600">
                          {transaction.destination_wallet_address}
                        </p>
                      </div>
                    )}
                    {transaction.proof_of_payment_url && (
                      <div className="col-span-2">
                        <p className="text-slate-400 mb-2">Proof of Payment</p>
                        <a 
                          href={transaction.proof_of_payment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
                        >
                          View Screenshot/Receipt <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-slate-400">Description</p>
                      <p className="text-white">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleApproveTransaction(transaction)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve {transaction.transaction_type === 'credit' ? 'Deposit' : 'Withdrawal'}
                    </Button>
                    <Button
                      onClick={() => handleRejectTransaction(transaction)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4 mt-6">
          {transfers.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg py-12 text-center text-slate-400">
              No pending transfers
            </div>
          ) : (
            transfers.map((transfer) => (
              <div key={transfer.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    Transfer Pending
                  </h3>
                  <Badge variant="secondary">
                    {new Date(transfer.created_at).toLocaleString()}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Amount</p>
                      <p className="text-white font-bold text-xl">${parseFloat(transfer.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Type</p>
                      <p className="text-white capitalize">{transfer.transfer_type}</p>
                    </div>
                    {transfer.notes && (
                      <div className="col-span-2">
                        <p className="text-slate-400">Notes</p>
                        <p className="text-white">{transfer.notes}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleApproveTransfer(transfer)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Transfer
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {/* Combined view of all pending transactions */}
          {transactions.length === 0 && transfers.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg py-12 text-center text-slate-400">
              No pending transactions
            </div>
          ) : (
            <>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-slate-400 text-sm">{transaction.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${parseFloat(transaction.amount).toFixed(2)}</p>
                      <p className="text-slate-400 text-sm">{transaction.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
