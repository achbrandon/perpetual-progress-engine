import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, Plus, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OTPVerificationModal } from "@/components/dashboard/OTPVerificationModal";

interface LinkedAccount {
  id: string;
  account_type: string;
  account_identifier: string;
  account_name: string | null;
  account_number: string | null;
  is_verified: boolean;
  verification_status: string;
  created_at: string;
}

const accountTypeInfo = {
  paypal: {
    label: "PayPal",
    placeholder: "email@example.com",
    inputLabel: "PayPal Email",
    description: "Enter the email address associated with your PayPal account",
    icon: "💳",
    color: "bg-blue-500",
    textColor: "text-blue-600"
  },
  cashapp: {
    label: "Cash App",
    placeholder: "$username",
    inputLabel: "Cash App Username",
    description: "Enter your Cash App $cashtag (e.g., $JohnDoe). Must match your account name.",
    icon: "💵",
    color: "bg-green-500",
    textColor: "text-green-600"
  },
  venmo: {
    label: "Venmo",
    placeholder: "@username",
    inputLabel: "Venmo Username",
    description: "Enter your Venmo username (e.g., @JohnDoe)",
    icon: "💰",
    color: "bg-blue-400",
    textColor: "text-blue-500"
  },
  zelle: {
    label: "Zelle",
    placeholder: "email@example.com or phone",
    inputLabel: "Zelle Email or Phone",
    description: "Enter the email or phone number linked to your Zelle account",
    icon: "🏦",
    color: "bg-purple-500",
    textColor: "text-purple-600"
  }
};

export default function LinkedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [newAccount, setNewAccount] = useState({
    account_type: "",
    account_identifier: "",
    account_name: "",
    account_number: ""
  });

  useEffect(() => {
    fetchAccounts();
    fetchUserEmail();
  }, []);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("external_payment_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  };

  const validateCashAppName = () => {
    if (newAccount.account_type === "cashapp") {
      const cashTag = newAccount.account_identifier.toLowerCase();
      const accountName = newAccount.account_name.toLowerCase();
      
      if (!cashTag.includes(accountName.split(' ')[0]) && !cashTag.includes(accountName.split(' ')[1] || '')) {
        toast.error("Your Cash App $cashtag must match your account name");
        return false;
      }
    }
    return true;
  };

  const handleAddAccount = async () => {
    if (!newAccount.account_type || !newAccount.account_identifier || !newAccount.account_name || !newAccount.account_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateCashAppName()) {
      return;
    }

    // Check for duplicate accounts
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existingAccounts, error } = await supabase
        .from("external_payment_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("account_type", newAccount.account_type)
        .eq("account_identifier", newAccount.account_identifier);

      if (error) throw error;

      if (existingAccounts && existingAccounts.length > 0) {
        toast.error("This account has already been linked to your profile");
        return;
      }

      setOtpModalOpen(true);
    } catch (error) {
      console.error("Error checking for duplicate accounts:", error);
      toast.error("Failed to verify account. Please try again.");
    }
  };

  const handleOTPVerified = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("external_payment_accounts")
        .insert({
          user_id: user.id,
          account_type: newAccount.account_type,
          account_identifier: newAccount.account_identifier,
          account_name: newAccount.account_name,
          account_number: newAccount.account_number,
          verification_status: "pending",
          is_verified: false
        });

      if (error) throw error;

      // Create an alert notification
      const { error: notificationError } = await supabase.from("alerts").insert({
        user_id: user.id,
        type: "info",
        title: "Account Verification Pending",
        message: `Your ${accountTypeInfo[newAccount.account_type as keyof typeof accountTypeInfo]?.label || newAccount.account_type} account (${newAccount.account_identifier}) has been added and is pending verification. You will receive an email notification once your account is reviewed.`,
        is_read: false
      });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      setAddingNew(false);
      setNewAccount({ account_type: "", account_identifier: "", account_name: "", account_number: "" });
      fetchAccounts();
      
      // Show review dialog
      setReviewDialogOpen(true);
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Failed to link account");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const { error } = await supabase
        .from("external_payment_accounts")
        .delete()
        .eq("id", accountToDelete);

      if (error) throw error;

      toast.success("Account unlinked successfully");
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to unlink account");
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Verification Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading linked accounts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Linked Payment Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Connect your external payment accounts for easy transfers
          </p>
        </div>
        <Button onClick={() => setAddingNew(true)} disabled={addingNew}>
          <Plus className="h-4 w-4 mr-2" />
          Link New Account
        </Button>
      </div>

      {addingNew && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link New Payment Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={newAccount.account_type}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newAccount.account_type && (
                <p className="text-sm text-muted-foreground">
                  {accountTypeInfo[newAccount.account_type as keyof typeof accountTypeInfo].description}
                </p>
              )}
            </div>

            {newAccount.account_type && (
              <>
                <div className="space-y-2">
                  <Label>Account Name *</Label>
                  <Input
                    placeholder="John Doe"
                    value={newAccount.account_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_name: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    This should match the name on your {accountTypeInfo[newAccount.account_type as keyof typeof accountTypeInfo].label} account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    {accountTypeInfo[newAccount.account_type as keyof typeof accountTypeInfo].inputLabel} *
                  </Label>
                  <Input
                    placeholder={accountTypeInfo[newAccount.account_type as keyof typeof accountTypeInfo].placeholder}
                    value={newAccount.account_identifier}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_identifier: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="Enter your account number"
                    value={newAccount.account_number}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_number: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddAccount} className="flex-1">
                Verify & Link Account
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddingNew(false);
                  setNewAccount({ account_type: "", account_identifier: "", account_name: "", account_number: "" });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Linked Accounts</h3>
            <p className="text-muted-foreground mb-4">
              Link your external payment accounts to enable easy transfers
            </p>
            <Button onClick={() => setAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Link Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => {
            const accountInfo = accountTypeInfo[account.account_type as keyof typeof accountTypeInfo];
            return (
              <Card key={account.id} className="overflow-hidden">
                <div className={`h-2 ${accountInfo?.color || 'bg-gray-500'}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{accountInfo?.icon}</span>
                        {accountInfo?.label || account.account_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {account.account_name || "Unnamed Account"}
                      </p>
                    </div>
                    {getStatusBadge(account.verification_status, account.is_verified)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Identifier</p>
                      <p className="font-mono text-sm">{account.account_identifier}</p>
                    </div>
                    {account.account_number && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <p className="font-mono text-sm">••••{account.account_number.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setAccountToDelete(account.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Unlink Account
                  </Button>

                  {account.verification_status === "pending" && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        ⏳ Pending Review
                      </p>
                      <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                        Your account is being reviewed. You will receive a notification via email once the review is complete. This may take 1-2 business days.
                      </p>
                    </div>
                  )}

                  {account.verification_status === "failed" && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Verification failed. Please contact support or try linking again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Payment Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this payment account? This action cannot be undone.
              You'll need to link it again if you want to use it in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
              Unlink Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OTPVerificationModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onVerify={handleOTPVerified}
        email={userEmail}
        accountType={newAccount.account_type}
        accountIdentifier={newAccount.account_identifier}
      />

      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Account Under Review - Pending
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your payment account has been successfully added and is now under review. 
              Our team will verify your account within 1-2 business days.
              <br /><br />
              You will receive:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>A notification in your notification bar</li>
                <li>An email confirmation once the review is complete</li>
              </ul>
              <br />
              <strong>Check your notification bar now to track the verification status.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setReviewDialogOpen(false)}>
              Okay, Got It!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
