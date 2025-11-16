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
import { BalanceHistoryChart } from "@/components/dashboard/BalanceHistoryChart";
import { EnhancedSupportChat } from "@/components/dashboard/EnhancedSupportChat";
import { useUserActivity } from "@/hooks/useUserActivity";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useLoginTracking } from "@/hooks/useLoginTracking";
import logo from "@/assets/vaultbank-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBar from "@/components/dashboard/NotificationBar";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Track user activity
  useUserActivity();
  useSessionTracking();
  useLoginTracking();

  useEffect(() => {
    checkAuth();
    fetchData();

    // Subscribe to real-time updates for accounts and transactions
    const accountsChannel = supabase
      .channel('accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(accountsChannel);
      supabase.removeChannel(transactionsChannel);
    };
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

    // For all other users, check profile status first
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // If user can transact and is verified, allow access
    if (profileData?.can_transact && profileData?.qr_verified) {
      setUser(user);
      setProfile(profileData);
      return;
    }

    // Check account application status only if can't transact yet
    const { data: application } = await supabase
      .from("account_applications")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    // If account is pending approval
    if (application?.status === 'pending') {
      toast.info(
        "🔍 Your account is under review. Please wait for approval.",
        { duration: 6000 }
      );
      navigate("/");
      return;
    }

    // If account is approved but QR not verified
    if (application?.status === 'approved' && !profileData?.qr_verified) {
      navigate("/verify-qr");
      return;
    }

    // If rejected
    if (application?.status === 'rejected') {
      toast.error(
        "Your account application was rejected. Please contact support.",
        { duration: 6000 }
      );
      navigate("/");
      return;
    }

    // Default: allow access if no blocking issues
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
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background to-muted">
        <DashboardSidebar onOpenSupport={() => setShowSupport(true)} />
        <div className="flex-1 flex flex-col w-full">
          <header className="glass sticky top-0 z-50 border-b border-border/40 safe-top">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger className="mobile-icon-button" />
                <img src={logo} alt="VaultBank" className="h-8 sm:h-10 lg:h-12" />
              </div>
              <div className="flex items-center gap-2">
                <NotificationBar />
                <ThemeToggle />
                <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto pull-refresh safe-bottom">
            {isDashboardHome ? (
              <div className="mobile-section max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-6 animate-fade-in">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="mobile-title text-foreground mb-1 sm:mb-2 truncate">
                        Welcome back
                      </h1>
                      <p className="mobile-subtitle text-muted-foreground truncate">
                        {profile?.full_name?.split(' ')[0] || 'User'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mobile-icon-button shrink-0" 
                      onClick={() => setShowBalances(!showBalances)}
                    >
                      {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <Card className="mobile-card-padding mb-4 sm:mb-6 bg-gradient-primary text-primary-foreground shadow-elegant border-0 overflow-hidden animate-scale-in card-interactive">
                  <div className="flex items-center justify-between relative">
                    <div className="z-10">
                      <p className="text-xs sm:text-sm font-medium opacity-90 mb-1 sm:mb-2">NET WORTH</p>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">
                        {showBalances ? `$${calculateNetWorth().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
                      </h2>
                      <p className="text-xs sm:text-sm opacity-90">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Wallet className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 opacity-10 absolute -right-2 -bottom-2 sm:relative sm:opacity-20" />
                  </div>
                </Card>

                <QuickActions onAction={fetchData} />

                <div className="mb-4 sm:mb-6 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold">Your Accounts</h2>
                    <Button 
                      size="sm" 
                      className="h-9 sm:h-10 text-xs sm:text-sm mobile-button" 
                      onClick={() => navigate("/dashboard/request-account")}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Account</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                  
                  {accounts.length === 0 ? (
                    <Card className="mobile-card-padding text-center animate-scale-in">
                      <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-medium mb-2">No accounts yet</h3>
                      <p className="text-sm text-muted-foreground">Request an account to get started</p>
                    </Card>
                  ) : (
                    <div className="mobile-grid">
                      {accounts.map((account, index) => (
                        <div 
                          key={account.id} 
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <AccountCard account={account} showBalance={showBalances} onRefresh={fetchData} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <BalanceHistoryChart />
                </div>

                {/* Mobile: Stack vertically, Desktop: Side by side */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Spending Insights - Show first on mobile */}
                  <div className="animate-fade-in-up lg:hidden" style={{ animationDelay: '0.3s' }}>
                    <SpendingInsights userId={user?.id} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                      <TransactionsList transactions={transactions} onRefresh={fetchData} />
                    </div>
                    {/* Spending Insights - Show in sidebar on desktop */}
                    <div className="hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                      <SpendingInsights userId={user?.id} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
      {showSupport && user && (
        <EnhancedSupportChat 
          userId={user.id} 
          onClose={() => setShowSupport(false)} 
        />
      )}
    </SidebarProvider>
  );
};

export default Dashboard;
