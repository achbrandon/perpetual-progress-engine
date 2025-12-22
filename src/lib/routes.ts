// Centralized route constants for easier maintenance
export const ROUTES = {
  // Public routes
  HOME: "/",
  BANK_HOME: "/bank",
  
  // Product pages
  CHECKING: "/bank/checking",
  SAVINGS: "/bank/savings",
  CDS: "/bank/cds",
  MONEY_MARKET: "/bank/money-market",
  CREDIT_CARDS: "/bank/credit-cards",
  LOANS: "/bank/loans",
  INVESTMENTS: "/bank/investments",
  TRANSFERS: "/bank/transfers",
  CRYPTO: "/bank/crypto",
  LOCATIONS: "/bank/locations",
  BUSINESS: "/bank/business",
  TRAVEL: "/bank/travel",
  
  // Auth routes
  LOGIN: "/bank/login",
  FORGOT_PASSWORD: "/bank/forgot-password",
  TOKEN_SIGNIN: "/bank/token-signin",
  OPEN_ACCOUNT: "/bank/open-account",
  VERIFY_QR: "/bank/verify-qr",
  VERIFY_EMAIL: "/bank/verify-email",
  VERIFICATION_SUCCESS: "/bank/verification-success",
  RESEND_EMAILS: "/bank/resend-emails",
  
  // Utility routes
  SCHEDULE_MEETING: "/bank/schedule-meeting",
  MORTGAGE_CALCULATOR: "/bank/mortgage-calculator",
  CREATE_TEST_ACCOUNT: "/bank/create-test-account",
  CREATE_ADMIN_ACCOUNT: "/bank/create-admin-account",
  CHECK_ADMIN: "/bank/check-admin",
  
  // Dashboard routes
  DASHBOARD: {
    ROOT: "/bank/dashboard",
    ACCOUNTS: "/bank/dashboard/accounts",
    TRANSFERS: "/bank/dashboard/transfers",
    BILL_PAY: "/bank/dashboard/bill-pay",
    MOBILE_DEPOSIT: "/bank/dashboard/mobile-deposit",
    CARDS: "/bank/dashboard/cards",
    CREDIT_SCORE: "/bank/dashboard/credit-score",
    LOANS: "/bank/dashboard/loans",
    STATEMENTS: "/bank/dashboard/statements",
    OFFERS: "/bank/dashboard/offers",
    ALERTS: "/bank/dashboard/alerts",
    SETTINGS: "/bank/dashboard/settings",
    ACH_ACCOUNTS: "/bank/dashboard/ach-accounts",
    CRYPTO: "/bank/dashboard/crypto",
    CARD_APPLICATION: "/bank/dashboard/card-application",
    ACCOUNT_DETAILS: "/bank/dashboard/account-details",
    GENERATE_STATEMENT: "/bank/dashboard/generate-statement",
    LOAN_APPLICATION: "/bank/dashboard/loan-application",
    ADMIN_SUPPORT: "/bank/dashboard/admin-support",
    JOINT_ACCOUNT_STATUS: "/bank/dashboard/joint-account-status",
    REQUEST_ACCOUNT: "/bank/dashboard/request-account",
    ANALYTICS: "/bank/dashboard/analytics",
    SUPPORT: "/bank/dashboard/support",
    LOGIN_HISTORY: "/bank/dashboard/login-history",
    LINKED_ACCOUNTS: "/bank/dashboard/linked-accounts",
    TRANSACTION_HISTORY: "/bank/dashboard/transaction-history",
    REVENUE_REPORTS: "/bank/dashboard/revenue-reports",
  },
  
  // Admin routes
  ADMIN: {
    ROOT: "/bank/admin",
    USERS: "/bank/admin/users",
    USER_MANAGEMENT: "/bank/admin/user-management",
    LIVE_MONITORING: "/bank/admin/live-monitoring",
    TRANSACTIONS: "/bank/admin/transactions",
    TRANSACTION_APPROVALS: "/bank/admin/transaction-approvals",
    APPLICATIONS: "/bank/admin/applications",
    ACTIVITY_LOGS: "/bank/admin/activity-logs",
    USER_ACTIVITY: "/bank/admin/user-activity",
    AUTH_LOGS: "/bank/admin/auth-logs",
    SEND_NOTIFICATION: "/bank/admin/send-notification",
    NOTIFICATION_HISTORY: "/bank/admin/notification-history",
    DOCUMENTS: "/bank/admin/documents",
    SUPPORT: "/bank/admin/support",
    LIVE_SUPPORT: "/bank/admin/live-support",
    TOPIC_ANALYTICS: "/bank/admin/topic-analytics",
    EMAIL_SYSTEM: "/bank/admin/email-system",
    JOINT_ACCOUNTS: "/bank/admin/joint-accounts",
    WALLET_SETTINGS: "/bank/admin/wallet-settings",
    SETTINGS: "/bank/admin/settings",
    ACCOUNT_REPAIR: "/bank/admin/account-repair",
    COMPLIANCE: "/bank/admin/compliance",
  },
} as const;

// Type for route values
export type RouteValue = typeof ROUTES[keyof typeof ROUTES] | string;
