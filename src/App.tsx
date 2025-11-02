import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Checking from "./pages/Checking";
import Savings from "./pages/Savings";
import CreditCards from "./pages/CreditCards";
import Loans from "./pages/Loans";
import Investments from "./pages/Investments";
import Transfers from "./pages/Transfers";
import Locations from "./pages/Locations";
import Crypto from "./pages/Crypto";
import OpenAccount from "./pages/OpenAccount";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import TokenSignIn from "./pages/TokenSignIn";
import VerifyQR from "./pages/VerifyQR";
import Dashboard from "./pages/Dashboard";
import CDs from "./pages/CDs";
import MoneyMarket from "./pages/MoneyMarket";
import Business from "./pages/Business";
import Travel from "./pages/Travel";
import ScheduleMeeting from "./pages/ScheduleMeeting";
import MortgageCalculator from "./pages/MortgageCalculator";
import BillPay from "./pages/dashboard/BillPay";
import MobileDeposit from "./pages/dashboard/MobileDeposit";
import Cards from "./pages/dashboard/Cards";
import CreditScore from "./pages/dashboard/CreditScore";
import DashboardLoans from "./pages/dashboard/Loans";
import Statements from "./pages/dashboard/Statements";
import Offers from "./pages/dashboard/Offers";
import Alerts from "./pages/dashboard/Alerts";
import Settings from "./pages/dashboard/Settings";
import Accounts from "./pages/dashboard/Accounts";
import DashboardTransfers from "./pages/dashboard/DashboardTransfers";
import Support from "./pages/dashboard/Support";
import ACHAccounts from "./pages/dashboard/ACHAccounts";
import CryptoWallet from "./pages/dashboard/CryptoWallet";
import CardApplication from "./pages/dashboard/CardApplication";
import AccountDetails from "./pages/dashboard/AccountDetails";
import StatementGenerator from "./pages/dashboard/StatementGenerator";
import LoanApplication from "./pages/dashboard/LoanApplication";
import AdminSupport from "./pages/dashboard/AdminSupport";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminApplications from "./pages/admin/Applications";
import AdminTransactions from "./pages/admin/Transactions";
import AdminSupportPage from "./pages/admin/Support";
import AdminEmailSystem from "./pages/admin/EmailSystem";
import AdminWalletSettings from "./pages/admin/WalletSettings";
import AdminUserActivity from "./pages/admin/UserActivity";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminLiveMonitoring from "./pages/admin/LiveMonitoring";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+Shift+4 to access admin panel
  useKeyboardShortcut(
    { key: "4", ctrlKey: true, shiftKey: true },
    () => navigate("/admin")
  );

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/checking" element={<Checking />} />
      <Route path="/savings" element={<Savings />} />
      <Route path="/cds" element={<CDs />} />
      <Route path="/money-market" element={<MoneyMarket />} />
      <Route path="/credit-cards" element={<CreditCards />} />
      <Route path="/loans" element={<Loans />} />
      <Route path="/investments" element={<Investments />} />
      <Route path="/transfers" element={<Transfers />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/crypto" element={<Crypto />} />
      <Route path="/open-account" element={<OpenAccount />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/token-signin" element={<TokenSignIn />} />
      <Route path="/business" element={<Business />} />
      <Route path="/travel" element={<Travel />} />
      <Route path="/schedule-meeting" element={<ScheduleMeeting />} />
      <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
      <Route path="/verify-qr" element={<VerifyQR />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/accounts" element={<Accounts />} />
      <Route path="/dashboard/transfers" element={<DashboardTransfers />} />
      <Route path="/dashboard/bill-pay" element={<BillPay />} />
      <Route path="/dashboard/mobile-deposit" element={<MobileDeposit />} />
      <Route path="/dashboard/cards" element={<Cards />} />
      <Route path="/dashboard/credit-score" element={<CreditScore />} />
      <Route path="/dashboard/loans" element={<DashboardLoans />} />
      <Route path="/dashboard/statements" element={<Statements />} />
      <Route path="/dashboard/offers" element={<Offers />} />
      <Route path="/dashboard/alerts" element={<Alerts />} />
      <Route path="/dashboard/settings" element={<Settings />} />
      <Route path="/dashboard/support" element={<Support />} />
      <Route path="/dashboard/ach-accounts" element={<ACHAccounts />} />
      <Route path="/dashboard/crypto" element={<CryptoWallet />} />
      <Route path="/dashboard/card-application" element={<CardApplication />} />
      <Route path="/dashboard/account-details" element={<AccountDetails />} />
      <Route path="/dashboard/generate-statement" element={<StatementGenerator />} />
      <Route path="/dashboard/loan-application" element={<LoanApplication />} />
      <Route path="/dashboard/admin-support" element={<AdminSupport />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="user-management" element={<AdminUserManagement />} />
        <Route path="live-monitoring" element={<AdminLiveMonitoring />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="email" element={<AdminEmailSystem />} />
        <Route path="wallets" element={<AdminWalletSettings />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="activity" element={<AdminUserActivity />} />
      </Route>
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
