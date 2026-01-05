# VaultBank Developer Guide

> **Last Updated:** January 5, 2026  
> **Project Type:** Full-Stack Banking Application  
> **Tech Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase (Lovable Cloud)

---

## 🏗️ Project Overview

VaultBank is a comprehensive banking application with:
- **Customer Dashboard** - Account management, transfers, transactions
- **Admin Panel** - User management, transaction approvals, compliance
- **Authentication** - Multi-factor auth with email verification, QR codes, and PIN

---

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn UI components (buttons, dialogs, etc.)
│   ├── dashboard/       # Customer dashboard components
│   ├── banking/         # Banking feature components
│   └── admin/           # Admin panel components
├── pages/               # Route pages
│   ├── admin/           # Admin panel pages (/bank/admin/*)
│   └── dashboard/       # Customer dashboard pages (/dashboard/*)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── contexts/            # React contexts (Theme, etc.)
└── integrations/        # Supabase client & types

supabase/
└── functions/           # Edge Functions (backend logic)
```

---

## 🔐 Authentication Flow

1. **Account Creation** (`/open-account`)
   - User fills application form with personal info
   - Documents uploaded (ID, selfie, address proof)
   - Email verification sent with QR code
   
2. **Email Verification** (`/verify-email`)
   - User clicks link in email
   - Redirected to QR verification page

3. **QR Verification** (`/verify-qr`)
   - User scans QR or enters secret key
   - Profile marked as `qr_verified: true`

4. **Admin Approval**
   - Admin reviews application in `/bank/admin/applications`
   - Approves or rejects with email notification

5. **Login** (`/auth`)
   - Email + Password + 6-digit PIN required
   - Checks: `email_verified`, `qr_verified`, account status

---

## 📊 Key Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with verification status |
| `accounts` | Bank accounts (checking, savings, etc.) |
| `transactions` | All financial transactions |
| `account_applications` | New account applications |
| `user_roles` | Admin/user role assignments |
| `transfers` | Transfer records between accounts |
| `cards` | Debit/credit card information |
| `loans` | Loan accounts and balances |
| `alerts` | User notifications/alerts |
| `support_tickets` | Customer support tickets |

---

## 🛣️ Main Routes

### Public Routes
- `/` - Landing page
- `/auth` - Login page
- `/open-account` - New account application
- `/forgot-password` - Password reset
- `/verify-email` - Email verification
- `/verify-qr` - QR code verification

### Customer Dashboard (`/dashboard/*`)
- `/dashboard` - Main dashboard with account overview
- `/dashboard/accounts` - All accounts list
- `/dashboard/transfers` - Money transfers
- `/dashboard/transactions` - Transaction history
- `/dashboard/cards` - Card management
- `/dashboard/settings` - Account settings
- `/dashboard/support` - Customer support chat

### Admin Panel (`/bank/admin/*`)
- `/bank/admin` - Admin dashboard with stats
- `/bank/admin/users` - User management
- `/bank/admin/transactions` - All transactions
- `/bank/admin/transaction-approvals` - Pending approvals
- `/bank/admin/applications` - Account applications
- `/bank/admin/send-notification` - Send alerts to users
- `/bank/admin/live-support` - Customer support chat
- `/bank/admin/compliance` - Compliance management

---

## 💳 Transaction System

### Transaction Types
- `credit` - Money coming in (deposits, transfers in)
- `debit` - Money going out (withdrawals, transfers out)
- `transfer` - Internal transfers

### Transaction Statuses
- `pending` - Awaiting approval/processing
- `completed` - Successfully processed
- `failed` - Transaction failed
- `cancelled` - Cancelled by user/admin

### Creating Transactions (Admin)
```typescript
// In admin panel - CreateTransactionForm.tsx
await supabase.from('transactions').insert({
  user_id: userId,
  account_id: accountId,
  amount: amount,
  type: 'credit', // or 'debit'
  description: 'Description here',
  status: 'pending', // or 'completed'
  reference_number: generateRefNumber()
});
```

---

## 🔔 Notification System

### Alert Types
- `security` - Security alerts (login attempts, etc.)
- `transaction` - Transaction notifications
- `inheritance` - Inheritance-related alerts
- `general` - General notifications

### Sending Notifications
```typescript
await supabase.from('alerts').insert({
  user_id: userId,
  title: 'Alert Title',
  message: 'Alert message content',
  type: 'transaction',
  is_read: false
});
```

---

## 🔧 Edge Functions

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `create-account-application` | Process new account applications |
| `send-verification-email` | Send email verification |
| `send-otp-email` | Send OTP codes |
| `send-login-otp` | Login verification codes |
| `approve-account-application` | Admin approval workflow |
| `send-application-decision` | Approval/rejection emails |
| `create-admin-account` | Create admin users |
| `support-bot` | AI support chat responses |

---

## 🎨 Styling System

Uses Tailwind CSS with custom design tokens in `src/index.css`:

```css
/* Key CSS Variables */
--background: /* Main background */
--foreground: /* Main text color */
--primary: /* Brand color */
--secondary: /* Secondary elements */
--muted: /* Muted backgrounds */
--accent: /* Accent highlights */
--destructive: /* Error/danger states */
```

**Important:** Always use semantic tokens, never direct colors:
```tsx
// ✅ Correct
<div className="bg-background text-foreground">

// ❌ Wrong
<div className="bg-white text-black">
```

---

## 🔑 Key Components

### Dashboard Components
- `AccountCard.tsx` - Individual account display card
- `TransactionsList.tsx` - Transaction history list
- `TransferModal.tsx` - Internal transfer modal
- `DomesticTransferModal.tsx` - Domestic wire transfers
- `InternationalTransferModal.tsx` - International transfers
- `EnhancedSupportChat.tsx` - Customer support chat

### Admin Components
- `AdminSidebar.tsx` - Admin navigation sidebar
- `CreateTransactionForm.tsx` - Create transactions for users
- `AdminNotifications.tsx` - Admin notification bell

---

## 📝 Common Tasks

### Add New Account Type
1. Update `account_type` options in forms
2. Add icon/styling in `AccountCard.tsx`
3. Update any type definitions

### Add New Transaction Type
1. Add type to transaction creation forms
2. Update `TransactionsList.tsx` to display properly
3. Add appropriate icons/colors

### Add New Admin Feature
1. Create page in `src/pages/admin/`
2. Add route in `src/App.tsx`
3. Add sidebar link in `AdminSidebar.tsx`

### Send User Notification
Use `/bank/admin/send-notification` or programmatically:
```typescript
await supabase.from('alerts').insert({...});
```

---

## ⚠️ Important Notes

1. **RLS Policies** - All tables have Row Level Security. Users can only access their own data.

2. **Profile Fields**
   - `can_transact` - If false, user cannot make transfers
   - `qr_verified` - Must be true for full access
   - `email_verified` - Must be true to login

3. **Admin Access** - Check `user_roles` table for admin role

4. **Test Accounts** - Use `/create-test-account` for testing

---

## 🚀 Quick Start for New Developer

1. **Understand the auth flow** - Read `AUTHENTICATION_FLOW.md`
2. **Check database schema** - Look at `src/integrations/supabase/types.ts`
3. **Review main dashboard** - `src/pages/Dashboard.tsx`
4. **Review admin panel** - `src/pages/admin/AdminDashboard.tsx`
5. **Test with sample data** - Create test account and transactions

---

## 📞 Support & Resources

- **Lovable Docs:** https://docs.lovable.dev
- **Supabase Docs:** https://supabase.com/docs
- **Shadcn UI:** https://ui.shadcn.com

---

*This guide should help you understand and continue development on VaultBank. If you need specific clarification on any feature, just ask!*
