import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function TransactionApprovals() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchTransactions();
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles:user_id (full_name, email),
          accounts:account_id (account_number, account_type)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTransaction) return;

    try {
      // Update transaction status to completed
      const { error: txError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", selectedTransaction.id);

      if (txError) throw txError;

      // If it's a debit transaction, update account balance
      if (selectedTransaction.type === "debit" && selectedTransaction.account_id) {
        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", selectedTransaction.account_id)
          .single();

        if (accountError) throw accountError;

        const newBalance = Number(account.balance) - Number(selectedTransaction.amount);

        const { error: updateError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", selectedTransaction.account_id);

        if (updateError) throw updateError;
      }

      // Send notification to user
      await supabase.from("alerts").insert({
        user_id: selectedTransaction.user_id,
        title: "Transaction Approved",
        message: `Your ${selectedTransaction.description} for $${parseFloat(selectedTransaction.amount).toFixed(2)} has been approved`,
        type: "success",
        is_read: false
      });

      toast.success("Transaction approved successfully");
      setSelectedTransaction(null);
      setActionType(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  const handleReject = async () => {
    if (!selectedTransaction) return;

    try {
      // Update transaction status to failed
      const { error } = await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      // Send notification to user
      await supabase.from("alerts").insert({
        user_id: selectedTransaction.user_id,
        title: "Transaction Rejected",
        message: `Your ${selectedTransaction.description} for $${parseFloat(selectedTransaction.amount).toFixed(2)} has been rejected`,
        type: "info",
        is_read: false
      });

      toast.success("Transaction rejected");
      setSelectedTransaction(null);
      setActionType(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      const selectedTxs = transactions.filter(tx => selectedTransactions.includes(tx.id));
      
      for (const tx of selectedTxs) {
        // Update transaction status to completed
        await supabase
          .from("transactions")
          .update({ status: "completed" })
          .eq("id", tx.id);

        // If it's a debit transaction, update account balance
        if (tx.type === "debit" && tx.account_id) {
          const { data: account } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", tx.account_id)
            .single();

          if (account) {
            const newBalance = Number(account.balance) - Number(tx.amount);
            await supabase
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", tx.account_id);
          }
        }

        // Send notification to user
        await supabase.from("alerts").insert({
          user_id: tx.user_id,
          title: "Transaction Approved",
          message: `Your ${tx.description} for $${parseFloat(tx.amount).toFixed(2)} has been approved`,
          type: "success",
          is_read: false
        });
      }

      toast.success(`${selectedTransactions.length} transactions approved successfully`);
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (error) {
      console.error("Error approving transactions:", error);
      toast.error("Failed to approve transactions");
    }
  };

  const handleBulkReject = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      const selectedTxs = transactions.filter(tx => selectedTransactions.includes(tx.id));
      
      for (const tx of selectedTxs) {
        await supabase
          .from("transactions")
          .update({ status: "failed" })
          .eq("id", tx.id);

        // Send notification to user
        await supabase.from("alerts").insert({
          user_id: tx.user_id,
          title: "Transaction Rejected",
          message: `Your ${tx.description} for $${parseFloat(tx.amount).toFixed(2)} has been rejected`,
          type: "info",
          is_read: false
        });
      }

      toast.success(`${selectedTransactions.length} transactions rejected`);
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (error) {
      console.error("Error rejecting transactions:", error);
      toast.error("Failed to reject transactions");
    }
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(tx => tx.id));
    }
  };

  const toggleSelectTransaction = (txId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(txId) 
        ? prev.filter(id => id !== txId)
        : [...prev, txId]
    );
  };

  const getTransactionIcon = (type: string) => {
    return type === "credit" ? (
      <ArrowDownRight className="h-5 w-5 text-green-500" />
    ) : (
      <ArrowUpRight className="h-5 w-5 text-red-500" />
    );
  };

  const getTransactionType = (description: string) => {
    if (description.includes("International")) return "International Wire";
    if (description.includes("Domestic")) return "Domestic Wire";
    if (description.includes("crypto") || description.includes("Bitcoin") || description.includes("Ethereum")) return "Crypto Withdrawal";
    if (description.includes("Transfer")) return "Transfer";
    if (description.includes("Bill Payment")) return "Bill Payment";
    return "Other";
  };

  const filterTransactions = (type: string) => {
    if (type === "all") return transactions;
    return transactions.filter(tx => getTransactionType(tx.description) === type);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Approvals</h1>
        <p className="text-muted-foreground">Review and approve pending transactions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Transactions ({transactions.length})
            </CardTitle>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} selected
                </span>
                <Button size="sm" variant="default" onClick={handleBulkApprove}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="international">International Wire ({filterTransactions("International Wire").length})</TabsTrigger>
              <TabsTrigger value="domestic">Domestic Wire ({filterTransactions("Domestic Wire").length})</TabsTrigger>
              <TabsTrigger value="crypto">Crypto ({filterTransactions("Crypto Withdrawal").length})</TabsTrigger>
              <TabsTrigger value="transfer">Transfers ({filterTransactions("Transfer").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending transactions</p>
                </div>
              ) : (
                <>
                  {transactions.length > 0 && (
                    <div className="flex items-center gap-2 p-4 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === transactions.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </div>
                  )}
                  {transactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      isSelected={selectedTransactions.includes(tx.id)}
                      onToggleSelect={() => toggleSelectTransaction(tx.id)}
                      onApprove={() => {
                        setSelectedTransaction(tx);
                        setActionType("approve");
                      }}
                      onReject={() => {
                        setSelectedTransaction(tx);
                        setActionType("reject");
                      }}
                      getTransactionIcon={getTransactionIcon}
                      getTransactionType={getTransactionType}
                    />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="international" className="space-y-3">
              {filterTransactions("International Wire").map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  isSelected={selectedTransactions.includes(tx.id)}
                  onToggleSelect={() => toggleSelectTransaction(tx.id)}
                  onApprove={() => {
                    setSelectedTransaction(tx);
                    setActionType("approve");
                  }}
                  onReject={() => {
                    setSelectedTransaction(tx);
                    setActionType("reject");
                  }}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionType={getTransactionType}
                />
              ))}
            </TabsContent>

            <TabsContent value="domestic" className="space-y-3">
              {filterTransactions("Domestic Wire").map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  isSelected={selectedTransactions.includes(tx.id)}
                  onToggleSelect={() => toggleSelectTransaction(tx.id)}
                  onApprove={() => {
                    setSelectedTransaction(tx);
                    setActionType("approve");
                  }}
                  onReject={() => {
                    setSelectedTransaction(tx);
                    setActionType("reject");
                  }}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionType={getTransactionType}
                />
              ))}
            </TabsContent>

            <TabsContent value="crypto" className="space-y-3">
              {filterTransactions("Crypto Withdrawal").map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  isSelected={selectedTransactions.includes(tx.id)}
                  onToggleSelect={() => toggleSelectTransaction(tx.id)}
                  onApprove={() => {
                    setSelectedTransaction(tx);
                    setActionType("approve");
                  }}
                  onReject={() => {
                    setSelectedTransaction(tx);
                    setActionType("reject");
                  }}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionType={getTransactionType}
                />
              ))}
            </TabsContent>

            <TabsContent value="transfer" className="space-y-3">
              {filterTransactions("Transfer").map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  isSelected={selectedTransactions.includes(tx.id)}
                  onToggleSelect={() => toggleSelectTransaction(tx.id)}
                  onApprove={() => {
                    setSelectedTransaction(tx);
                    setActionType("approve");
                  }}
                  onReject={() => {
                    setSelectedTransaction(tx);
                    setActionType("reject");
                  }}
                  getTransactionIcon={getTransactionIcon}
                  getTransactionType={getTransactionType}
                />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedTransaction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Transaction?" : "Reject Transaction?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTransaction && (
                <div className="space-y-2 mt-4">
                  <p><strong>User:</strong> {selectedTransaction.profiles?.full_name}</p>
                  <p><strong>Amount:</strong> ${parseFloat(selectedTransaction.amount).toFixed(2)}</p>
                  <p><strong>Type:</strong> {getTransactionType(selectedTransaction.description)}</p>
                  <p><strong>Description:</strong> {selectedTransaction.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {actionType === "approve" 
                      ? "This will complete the transaction and update the account balance." 
                      : "This will mark the transaction as failed and notify the user."}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === "approve" ? handleApprove : handleReject}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransactionCard({ 
  transaction, 
  isSelected,
  onToggleSelect,
  onApprove, 
  onReject, 
  getTransactionIcon, 
  getTransactionType 
}: any) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="mt-1 h-4 w-4 rounded border-border"
      />
      <div className="mt-1">{getTransactionIcon(transaction.type)}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{transaction.profiles?.full_name}</p>
          <Badge variant="outline">{getTransactionType(transaction.description)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{transaction.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {parseFloat(transaction.amount).toFixed(2)}
          </span>
          <span>{transaction.accounts?.account_type} - ****{transaction.accounts?.account_number?.slice(-4)}</span>
          <span>{new Date(transaction.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={onApprove}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject}>
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}
