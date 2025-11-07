import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Wallet, Eye, EyeOff, Plus } from "lucide-react";
import { AccountCard } from "@/components/dashboard/AccountCard";
import { TransactionsList } from "@/components/dashboard/TransactionsList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SpendingInsights } from "@/components/dashboard/SpendingInsights";
import { useUserActivity } from "@/hooks/useUserActivity";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import logo from "@/assets/vaultbank-logo.png";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Track user activity
  useUserActivity();
  useSessionTracking();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    // CRITICAL: Check if user completed full authentication
    const authCompleted = sessionStorage.getItem('auth_verification_completed');
    
    if (!authCompleted) {
      console.log("No auth verification flag - forcing logout");
      await supabase.auth.signOut();
      sessionStorage.clear();
      toast.error("Please complete the full authentication process (Email → PIN → OTP)");
      navigate("/auth", { replace: true });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to access your dashboard");
      navigate("/auth");
      return;
    }

    // Bypass verification checks for test accounts
    if (user.email === 'ambaheu@gmail.com' || user.email === 'test@vaultbank.com') {
      setUser(user);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(profileData);
      return;
    }

    // For all other users, check verification status
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData?.qr_verified) {
      navigate("/verify-qr");
      return;
    }

    setUser(user);
    setProfile(profileData);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetWorth = () => {
    return accounts.reduce((total, account) => {
      return total + parseFloat(account.balance || 0);
    }, 0);
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem('auth_verification_completed');
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const isDashboardHome = location.pathname === '/dashboard';

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-banking-navy via-banking-secondary to-banking-primary">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col w-full">
          <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img src={logo} alt="VaultBank" className="h-12" />
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {isDashboardHome ? (
              <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        Welcome back, {profile?.full_name}
                      </h1>
                      <p className="text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowBalances(!showBalances)}>
                      {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <Card className="p-6 mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">NET WORTH</p>
                      <h2 className="text-4xl font-bold">
                        {showBalances ? `$${calculateNetWorth().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
                      </h2>
                      <p className="text-sm opacity-80 mt-2">
                        Based on {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Wallet className="h-16 w-16 opacity-20" />
                  </div>
                </Card>

                <QuickActions onAction={fetchData} />

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Your Accounts</h2>
                    <Button size="sm" onClick={() => navigate("/dashboard/request-account")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </div>
                  
                  {accounts.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No accounts yet</h3>
                      <p className="text-muted-foreground mb-4">Open your first account to get started</p>
                      <Button onClick={() => navigate("/open-account")}>Open Account</Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {accounts.map((account) => (
                        <AccountCard key={account.id} account={account} showBalance={showBalances} onRefresh={fetchData} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TransactionsList transactions={transactions} onRefresh={fetchData} />
                  </div>
                  <div>
                    <SpendingInsights userId={user?.id} />
                  </div>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
