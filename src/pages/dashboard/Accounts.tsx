import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccountCard } from "@/components/dashboard/AccountCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddAccountDialog } from "@/components/dashboard/AddAccountDialog";

export default function Accounts() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    fetchAccounts(user.id);
  };

  const fetchAccounts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      if (data) setAccounts(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Accounts</h1>
          <p className="text-muted-foreground">Overview of all your accounts</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            showBalance={showBalance}
            onRefresh={() => fetchAccounts(user.id)}
          />
        ))}
      </div>

      <AddAccountDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        userId={user?.id || ""}
        onSuccess={() => fetchAccounts(user.id)}
      />
    </div>
  );
}
