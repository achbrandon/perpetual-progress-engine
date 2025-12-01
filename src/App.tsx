import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import { AdminAccessDialog } from "./components/AdminAccessDialog";
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
import VerifyEmail from "./pages/VerifyEmail";
import VerificationSuccess from "./pages/VerificationSuccess";
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
import JointAccountStatus from "./pages/dashboard/JointAccountStatus";
import RequestAccount from "./pages/dashboard/RequestAccount";
import Analytics from "./pages/dashboard/Analytics";
import LinkedAccounts from "./pages/dashboard/LinkedAccounts";
import LiveSupport from "./pages/admin/LiveSupport";
import DocumentsView from "./pages/admin/DocumentsView";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminApplications from "./pages/admin/Applications";
import AdminTransactions from "./pages/admin/Transactions";
import TransactionApprovals from "./pages/admin/TransactionApprovals";
import AdminSupportPage from "./pages/admin/Support";
import AdminEmailSystem from "./pages/admin/EmailSystem";
import AdminWalletSettings from "./pages/admin/WalletSettings";
import AdminUserActivity from "./pages/admin/UserActivity";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminLiveMonitoring from "./pages/admin/LiveMonitoring";
import AdminSettings from "./pages/admin/AdminSettings";
import TopicAnalytics from "./pages/admin/TopicAnalytics";
import ResendEmails from "./pages/ResendEmails";
import CreateTestAccount from "./pages/CreateTestAccount";
import CreateAdminAccount from "./pages/CreateAdminAccount";
import CheckAdmin from "./pages/CheckAdmin";
import ActivityLogs from "./pages/admin/ActivityLogs";
import AuthenticationLogs from "./pages/admin/AuthenticationLogs";
import LoginHistory from "./pages/dashboard/LoginHistory";
import AccountRepair from "./pages/admin/AccountRepair";
import JointAccountRequests from "./pages/admin/JointAccountRequests";
import SendNotification from "./pages/admin/SendNotification";
import NotificationHistory from "./pages/admin/NotificationHistory";
import TransactionHistory from "./pages/dashboard/TransactionHistory";
import RevenueReports from "./pages/dashboard/RevenueReports";
import { useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+4 to open test account page
  useKeyboardShortcut(
    { key: "4", ctrlKey: true, shiftKey: true },
    () => navigate("/bank/create-test-account")
  );

  // Keyboard shortcut: Ctrl+Shift+A to open admin access dialog
  useKeyboardShortcut(
    { key: "a", ctrlKey: true, shiftKey: true },
    () => setAdminDialogOpen(true)
  );

  return (
    <>
      <AdminAccessDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen} />
      <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/bank" element={<Index />} />
      <Route path="/bank/checking" element={<Checking />} />
      <Route path="/bank/savings" element={<Savings />} />
      <Route path="/bank/cds" element={<CDs />} />
      <Route path="/bank/money-market" element={<MoneyMarket />} />
      <Route path="/bank/credit-cards" element={<CreditCards />} />
      <Route path="/bank/loans" element={<Loans />} />
      <Route path="/bank/investments" element={<Investments />} />
      <Route path="/bank/transfers" element={<Transfers />} />
      <Route path="/bank/locations" element={<Locations />} />
      <Route path="/bank/crypto" element={<Crypto />} />
      <Route path="/bank/open-account" element={<OpenAccount />} />
      <Route path="/bank/login" element={<Auth />} />
      <Route path="/bank/forgot-password" element={<ForgotPassword />} />
      <Route path="/bank/token-signin" element={<TokenSignIn />} />
      <Route path="/bank/business" element={<Business />} />
      <Route path="/bank/travel" element={<Travel />} />
      <Route path="/bank/schedule-meeting" element={<ScheduleMeeting />} />
      <Route path="/bank/mortgage-calculator" element={<MortgageCalculator />} />
      <Route path="/bank/verify-qr" element={<VerifyQR />} />
      <Route path="/bank/verify-email" element={<VerifyEmail />} />
      <Route path="/bank/verification-success" element={<VerificationSuccess />} />
      <Route path="/bank/resend-emails" element={<ResendEmails />} />
      <Route path="/bank/create-test-account" element={<CreateTestAccount />} />
      <Route path="/bank/create-admin-account" element={<CreateAdminAccount />} />
      <Route path="/bank/check-admin" element={<CheckAdmin />} />
      <Route path="/bank/dashboard" element={<Dashboard />} />
      <Route path="/bank/dashboard/accounts" element={<Accounts />} />
      <Route path="/bank/dashboard/transfers" element={<DashboardTransfers />} />
      <Route path="/bank/dashboard/bill-pay" element={<BillPay />} />
      <Route path="/bank/dashboard/mobile-deposit" element={<MobileDeposit />} />
      <Route path="/bank/dashboard/cards" element={<Cards />} />
      <Route path="/bank/dashboard/credit-score" element={<CreditScore />} />
      <Route path="/bank/dashboard/loans" element={<DashboardLoans />} />
      <Route path="/bank/dashboard/statements" element={<Statements />} />
      <Route path="/bank/dashboard/offers" element={<Offers />} />
      <Route path="/bank/dashboard/alerts" element={<Alerts />} />
      <Route path="/bank/dashboard/settings" element={<Settings />} />
      <Route path="/bank/dashboard/ach-accounts" element={<ACHAccounts />} />
      <Route path="/bank/dashboard/crypto" element={<CryptoWallet />} />
      <Route path="/bank/dashboard/card-application" element={<CardApplication />} />
      <Route path="/bank/dashboard/account-details" element={<AccountDetails />} />
      <Route path="/bank/dashboard/generate-statement" element={<StatementGenerator />} />
      <Route path="/bank/dashboard/loan-application" element={<LoanApplication />} />
      <Route path="/bank/dashboard/admin-support" element={<AdminSupport />} />
      <Route path="/bank/dashboard/joint-account-status" element={<JointAccountStatus />} />
      <Route path="/bank/dashboard/request-account" element={<RequestAccount />} />
      <Route path="/bank/dashboard/analytics" element={<Analytics />} />
      <Route path="/bank/dashboard/support" element={<Support />} />
      <Route path="/bank/dashboard/login-history" element={<LoginHistory />} />
      <Route path="/bank/dashboard/linked-accounts" element={<LinkedAccounts />} />
      <Route path="/bank/dashboard/transaction-history" element={<TransactionHistory />} />
      <Route path="/bank/dashboard/revenue-reports" element={<RevenueReports />} />
      
      {/* Admin Routes */}
      <Route path="/bank/admin" element={<AdminDashboard />}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="user-management" element={<AdminUserManagement />} />
        <Route path="live-monitoring" element={<AdminLiveMonitoring />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="joint-accounts" element={<JointAccountRequests />} />
        <Route path="documents" element={<DocumentsView />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="transaction-approvals" element={<TransactionApprovals />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="live-support" element={<LiveSupport />} />
        <Route path="email" element={<AdminEmailSystem />} />
        <Route path="send-notification" element={<SendNotification />} />
        <Route path="notification-history" element={<NotificationHistory />} />
        <Route path="wallets" element={<AdminWalletSettings />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="activity" element={<AdminUserActivity />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="authentication-logs" element={<AuthenticationLogs />} />
        <Route path="account-repair" element={<AccountRepair />} />
        <Route path="topic-analytics" element={<TopicAnalytics />} />
      </Route>
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
