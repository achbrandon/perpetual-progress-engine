# Joint Account Smart Notification System

## Overview

The Joint Account Smart Notification System automatically sends real-time updates to both the primary account holder and their partner throughout the entire joint account approval process. This ensures transparency and keeps both parties informed at every stage.

## Architecture

### Components

1. **Edge Function**: `supabase/functions/joint-account-notifications/index.ts`
   - Handles notification logic server-side
   - Determines appropriate messages based on stage
   - Creates notifications in the alerts table
   - Logs partner notifications for email integration

2. **Client Library**: `src/lib/jointAccountNotifications.ts`
   - Provides convenient functions to trigger notifications
   - Type-safe notification stages
   - Error handling and logging

3. **Integration Points**:
   - `src/components/dashboard/AddJointHolderDialog.tsx` - Initial request submission
   - `src/pages/admin/JointAccountRequests.tsx` - Admin approval/rejection
   - Additional integration points can be added for OTP verification, document uploads, etc.

## Notification Stages

### 1. Request Submitted (`request_submitted`)
**Triggered when**: Primary holder submits joint account request

**Primary Holder Receives**:
> "Joint account request submitted for [Partner Name]. Waiting for partner to complete verification steps."

**Partner Receives**:
> "[Primary Holder Name] has invited you to join their joint account. Please complete the 1% security deposit and verification process."

**Usage**:
```typescript
import { notifyRequestSubmitted } from "@/lib/jointAccountNotifications";

// After creating joint account request
await notifyRequestSubmitted(requestId);
```

### 2. Deposit Received (`deposit_received`)
**Triggered when**: Partner completes 1% security deposit

**Primary Holder Receives**:
> "Partner [Name] has completed the 1% security deposit of $[amount]. Waiting for OTP verification."

**Partner Receives**:
> "Your deposit of $[amount] has been received. Please check your email for the OTP verification code."

**Usage**:
```typescript
import { notifyDepositReceived } from "@/lib/jointAccountNotifications";

// After deposit is confirmed
await notifyDepositReceived(requestId);
```

### 3. OTP Verified (`otp_verified`)
**Triggered when**: Partner successfully verifies OTP

**Primary Holder Receives**:
> "[Partner Name] has verified their identity via OTP. Waiting for document uploads."

**Partner Receives**:
> "OTP verification successful! Please upload your ID documents and proof of address to continue."

**Usage**:
```typescript
import { notifyOtpVerified } from "@/lib/jointAccountNotifications";

// After OTP verification
await notifyOtpVerified(requestId);
```

### 4. Documents Uploaded (`documents_uploaded`)
**Triggered when**: Partner uploads required documents

**Primary Holder Receives**:
> "[Partner Name] has uploaded all required documents. Your joint account request is now under admin review."

**Partner Receives**:
> "Documents uploaded successfully! Your joint account application is now being reviewed by our team."

**Usage**:
```typescript
import { notifyDocumentsUploaded } from "@/lib/jointAccountNotifications";

// After documents are uploaded
await notifyDocumentsUploaded(requestId);
```

### 5. Under Review (`under_review`)
**Triggered when**: Admin begins reviewing the application

**Primary Holder Receives**:
> "Your joint account request with [Partner Name] is currently under admin review. This typically takes 1-2 business days."

**Partner Receives**:
> "Your joint account application with [Primary Holder Name] is under review. You'll be notified once approved."

**Usage**:
```typescript
import { notifyUnderReview } from "@/lib/jointAccountNotifications";

// When admin starts review
await notifyUnderReview(requestId);
```

### 6. Approved (`approved`)
**Triggered when**: Admin approves the joint account request

**Primary Holder Receives**:
> "Great news! Your joint account request with [Partner Name] has been approved. The account is now active with full access for both holders."

**Partner Receives**:
> "Congratulations! Your joint account application has been approved. You now have full access to account [Account Number]."

**Usage**:
```typescript
import { notifyApproved } from "@/lib/jointAccountNotifications";

// After admin approval
await notifyApproved(requestId);
```

### 7. Rejected (`rejected`)
**Triggered when**: Admin rejects the joint account request

**Primary Holder Receives**:
> "Your joint account request with [Partner Name] has been declined. Please contact support for more information."

**Partner Receives**:
> "Unfortunately, your joint account application has been declined. Please contact support for details."

**Usage**:
```typescript
import { notifyRejected } from "@/lib/jointAccountNotifications";

// After admin rejection
await notifyRejected(requestId);
```

### 8. Activated (`activated`)
**Triggered when**: Joint account is fully activated and ready for use

**Primary Holder Receives**:
> "Your joint account with [Partner Name] is now fully activated! Both holders can now make unlimited withdrawals to verified payment methods."

**Partner Receives**:
> "Your joint account is now active! You have full access and can withdraw to your pre-verified payment method used for the deposit."

**Usage**:
```typescript
import { notifyActivated } from "@/lib/jointAccountNotifications";

// After account activation
await notifyActivated(requestId);
```

## Implementation Guide

### Adding Notifications to New Integration Points

1. **Import the notification function**:
```typescript
import { sendJointAccountNotification } from "@/lib/jointAccountNotifications";
// or import specific stage functions
import { notifyDepositReceived, notifyOtpVerified } from "@/lib/jointAccountNotifications";
```

2. **Call the notification function** at the appropriate point:
```typescript
try {
  // Your main logic here
  
  // Send notification
  await notifyDepositReceived(requestId);
  
  // Continue with success handling
} catch (error) {
  // Error handling
}
```

3. **Handle errors gracefully**:
```typescript
// Notification failures should not block the main process
try {
  await notifyStage(requestId);
} catch (notifError) {
  console.error('Failed to send notification:', notifError);
  // Continue execution - notification is non-critical
}
```

## Database Schema

Notifications are stored in the `alerts` table with the following structure:

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'success', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Email Integration (Future Enhancement)

Currently, partner notifications are logged for future email implementation. To add email functionality:

1. Use the Resend integration in `supabase/functions/send-notification-email/`
2. Update the notification edge function to call email service
3. Add email templates for each stage

Example structure:
```typescript
// In joint-account-notifications/index.ts
const resendApiKey = Deno.env.get('RESEND_API_KEY');
if (resendApiKey && partnerEmail) {
  await sendEmail({
    to: partnerEmail,
    subject: 'Joint Account Update',
    html: emailTemplate
  });
}
```

## Best Practices

1. **Always wrap notification calls in try-catch** to prevent blocking main functionality
2. **Log notification failures** for debugging but don't show errors to users
3. **Use semantic notification types**: 'info' for updates, 'success' for approvals, 'error' for rejections
4. **Keep messages concise** but informative
5. **Include relevant details** like partner names, amounts, account numbers where appropriate

## Testing

To test the notification system:

1. **Create a test joint account request**:
   - Use the AddJointHolderDialog in the dashboard
   - Verify primary holder receives "request_submitted" notification

2. **Test each stage manually**:
   - Call notification functions directly with a test requestId
   - Check alerts table for proper notification creation
   - Verify message content matches expected output

3. **Admin workflow testing**:
   - Approve/reject test requests
   - Verify both parties receive appropriate notifications

## Troubleshooting

### Notifications not appearing

1. Check edge function logs:
```bash
supabase functions logs joint-account-notifications
```

2. Verify edge function is deployed:
```bash
supabase functions list
```

3. Check alerts table for entries:
```sql
SELECT * FROM alerts WHERE user_id = '[user-id]' ORDER BY created_at DESC;
```

### Partner notifications not working

- Partner notifications are currently logged (not sent to partner's account)
- Partner must create an account to view notifications
- Future: implement email notifications for partners without accounts

## Future Enhancements

1. **Email Notifications**: Send emails to partners who don't have accounts yet
2. **SMS Notifications**: Add SMS integration for critical updates
3. **Push Notifications**: Browser push notifications for real-time updates
4. **Notification Preferences**: Allow users to customize which notifications they receive
5. **Rich Notifications**: Add action buttons, images, and formatted content
6. **Notification History**: Dedicated page to view all joint account notifications
7. **Multi-language Support**: Translate notifications based on user preferences

## Related Documentation

- [Joint Account System Overview](./JOINT_ACCOUNT_SYSTEM.md)
- [Notification Templates](./src/lib/notifications.ts)
- [Admin Joint Account Management](./src/pages/admin/JointAccountRequests.tsx)
