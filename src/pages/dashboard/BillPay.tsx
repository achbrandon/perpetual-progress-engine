import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FileText, Plus, Calendar, DollarSign, Trash2, Edit, Pause, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import bankLogo from "@/assets/vaultbank-logo.png";

export default function BillPay() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState<any>(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    accountId: "",
    payeeName: "",
    payeeAccount: "",
    payeeAddress: "",
    amount: "",
    paymentDate: "",
    isRecurring: false,
    recurringFrequency: "",
    notes: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      const [accountsRes, paymentsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", userId).eq("status", "active"),
        supabase.from("bill_payments").select("*").eq("user_id", userId).order("payment_date", { ascending: false }),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setProcessingPayment(true);
    setShowLoadingSpinner(true);

    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("bill_payments")
          .update({
            account_id: formData.accountId,
            payee_name: formData.payeeName,
            payee_account: formData.payeeAccount,
            payee_address: formData.payeeAddress || null,
            amount: parseFloat(formData.amount),
            payment_date: formData.paymentDate,
            is_recurring: formData.isRecurring,
            recurring_frequency: formData.recurringFrequency || null,
            notes: formData.notes || null,
          })
          .eq("id", editingPayment.id);

        if (error) throw error;
        toast.success("Bill payment updated successfully");
      } else {
        const { error } = await supabase.from("bill_payments").insert({
          user_id: user.id,
          payee_name: formData.payeeName,
          account_number: formData.payeeAccount,
          amount: parseFloat(formData.amount),
          payment_date: formData.paymentDate,
          status: "scheduled"
        } as any);

        if (error) throw error;

        // Create transaction record for the bill payment
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: formData.accountId,
          type: "debit",
          amount: parseFloat(formData.amount),
          description: `Bill Payment to ${formData.payeeName}`,
          status: "pending"
        });
      }

      setTimeout(() => {
        setShowLoadingSpinner(false);
        if (editingPayment) {
          toast.success("Bill payment updated successfully");
        } else {
          toast.success("Bill payment scheduled successfully");
        }
        setShowAddForm(false);
        setEditingPayment(null);
        setFormData({
          accountId: "",
          payeeName: "",
          payeeAccount: "",
          payeeAddress: "",
          amount: "",
          paymentDate: "",
          isRecurring: false,
          recurringFrequency: "",
          notes: "",
        });
        fetchData(user.id);
      }, 2000);
    } catch (error) {
      console.error("Error scheduling payment:", error);
      toast.error("Failed to schedule payment");
      setShowLoadingSpinner(false);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleEdit = (payment: any) => {
    setEditingPayment(payment);
    setFormData({
      accountId: payment.account_id,
      payeeName: payment.payee_name,
      payeeAccount: payment.payee_account || "",
      payeeAddress: payment.payee_address || "",
      amount: payment.amount.toString(),
      paymentDate: payment.payment_date,
      isRecurring: payment.is_recurring,
      recurringFrequency: payment.recurring_frequency || "",
      notes: payment.notes || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;

    try {
      const { error } = await supabase
        .from("bill_payments")
        .delete()
        .eq("id", deletingPayment.id);

      if (error) throw error;
      
      toast.success("Payment cancelled successfully");
      setDeletingPayment(null);
      fetchData(user!.id);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to cancel payment");
    }
  };

  const getNextPaymentDate = (payment: any) => {
    if (!payment.is_recurring) return null;
    
    const lastDate = new Date(payment.payment_date);
    const today = new Date();
    
    while (lastDate < today) {
      switch (payment.recurring_frequency) {
        case "weekly":
          lastDate.setDate(lastDate.getDate() + 7);
          break;
        case "biweekly":
          lastDate.setDate(lastDate.getDate() + 14);
          break;
        case "monthly":
          lastDate.setMonth(lastDate.getMonth() + 1);
          break;
        case "quarterly":
          lastDate.setMonth(lastDate.getMonth() + 3);
          break;
        case "annually":
          lastDate.setFullYear(lastDate.getFullYear() + 1);
          break;
      }
    }
    
    return lastDate;
  };

  const upcomingPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const today = new Date();
    return p.status === "scheduled" && paymentDate >= today;
  });

  const completedPayments = payments.filter(p => p.status === "completed");
  const recurringPayments = payments.filter(p => p.is_recurring && p.status === "scheduled");

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bill Pay</h1>
          <p className="text-muted-foreground">Manage and schedule bill payments</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Payment
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPayment ? "Edit Payment" : "Schedule New Payment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account">From Account</Label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_type} - ${parseFloat(account.balance || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payeeName">Payee Name</Label>
                  <Input
                    id="payeeName"
                    placeholder="Electric Company"
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payeeAccount">Payee Account Number</Label>
                  <Input
                    id="payeeAccount"
                    placeholder="Account #123456"
                    value={formData.payeeAccount}
                    onChange={(e) => setFormData({ ...formData, payeeAccount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payeeAddress">Payee Address (Optional)</Label>
                  <Input
                    id="payeeAddress"
                    placeholder="123 Main St"
                    value={formData.payeeAddress}
                    onChange={(e) => setFormData({ ...formData, payeeAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked, recurringFrequency: checked ? "monthly" : "" })}
                />
                <Label htmlFor="recurring" className="cursor-pointer">Make this a recurring payment</Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurringFrequency">Frequency</Label>
                  <Select 
                    value={formData.recurringFrequency} 
                    onValueChange={(value) => setFormData({ ...formData, recurringFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingPayment ? "Update Payment" : "Schedule Payment"}</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPayment(null);
                    setFormData({
                      accountId: "",
                      payeeName: "",
                      payeeAccount: "",
                      payeeAddress: "",
                      amount: "",
                      paymentDate: "",
                      isRecurring: false,
                      recurringFrequency: "",
                      notes: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingPayments.length})</TabsTrigger>
              <TabsTrigger value="recurring">Recurring ({recurringPayments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments scheduled</p>
              ) : (
                payments.map((payment) => (
                  <PaymentCard 
                    key={payment.id} 
                    payment={payment} 
                    onEdit={handleEdit}
                    onDelete={() => setDeletingPayment(payment)}
                    getNextPaymentDate={getNextPaymentDate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming payments</p>
              ) : (
                upcomingPayments.map((payment) => (
                  <PaymentCard 
                    key={payment.id} 
                    payment={payment} 
                    onEdit={handleEdit}
                    onDelete={() => setDeletingPayment(payment)}
                    getNextPaymentDate={getNextPaymentDate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4 mt-4">
              {recurringPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recurring payments</p>
              ) : (
                recurringPayments.map((payment) => (
                  <PaymentCard 
                    key={payment.id} 
                    payment={payment} 
                    onEdit={handleEdit}
                    onDelete={() => setDeletingPayment(payment)}
                    getNextPaymentDate={getNextPaymentDate}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {completedPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed payments</p>
              ) : (
                completedPayments.map((payment) => (
                  <PaymentCard 
                    key={payment.id} 
                    payment={payment} 
                    onEdit={handleEdit}
                    onDelete={() => setDeletingPayment(payment)}
                    getNextPaymentDate={getNextPaymentDate}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingPayment} onOpenChange={() => setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this payment to {deletingPayment?.payee_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Payment</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Cancel Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showLoadingSpinner && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <img 
              src={bankLogo} 
              alt="VaultBank" 
              className="h-20 w-auto mx-auto animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <p className="text-lg font-semibold">Processing your payment...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentCard({ payment, onEdit, onDelete, getNextPaymentDate }: any) {
  const nextDate = getNextPaymentDate(payment);
  const paymentDate = new Date(payment.payment_date);
  const isUpcoming = payment.status === "scheduled" && paymentDate >= new Date();

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{payment.payee_name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {payment.is_recurring && (
              <>
                <Badge variant="secondary" className="capitalize">
                  {payment.recurring_frequency}
                </Badge>
                {nextDate && isUpcoming && (
                  <span className="text-xs">
                    Next: {nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </>
            )}
          </div>
          {payment.notes && (
            <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-lg">${parseFloat(payment.amount).toFixed(2)}</p>
          <Badge 
            variant={
              payment.status === "completed" ? "default" : 
              payment.status === "scheduled" ? "secondary" : 
              "destructive"
            }
            className="capitalize"
          >
            {payment.status}
          </Badge>
        </div>
        {payment.status === "scheduled" && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(payment)}
              title="Edit payment"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              title="Cancel payment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
