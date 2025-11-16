import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'pending';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { error } = await supabase.from("alerts").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

/**
 * Pre-defined notification templates for common scenarios
 */
export const NotificationTemplates = {
  // Account Updates
  accountApproved: (userName: string) => ({
    title: "Account Approved",
    message: `Welcome ${userName}! Your account has been approved and is now active.`,
    type: "success" as NotificationType,
  }),

  jointAccountApproved: (partnerName: string) => ({
    title: "Joint Account Request Approved",
    message: `Your joint account request with ${partnerName} has been approved! You can now proceed with the next steps.`,
    type: "success" as NotificationType,
  }),

  jointAccountRejected: (partnerName: string) => ({
    title: "Joint Account Request Rejected",
    message: `Your joint account request with ${partnerName} has been rejected. Please contact support for more information.`,
    type: "error" as NotificationType,
  }),

  accountClosed: () => ({
    title: "Account Closed",
    message: "Your account has been closed. All remaining funds have been transferred as requested.",
    type: "info" as NotificationType,
  }),

  // Transaction notifications
  transactionCompleted: (amount: number, description: string) => ({
    title: "Transaction Completed",
    message: `Your transaction of $${amount.toFixed(2)} for ${description} has been completed successfully.`,
    type: "success" as NotificationType,
  }),

  transactionPending: (amount: number, description: string) => ({
    title: "Transaction Pending",
    message: `Your transaction of $${amount.toFixed(2)} for ${description} is being processed.`,
    type: "pending" as NotificationType,
  }),

  transactionFailed: (amount: number, description: string) => ({
    title: "Transaction Failed",
    message: `Your transaction of $${amount.toFixed(2)} for ${description} could not be completed.`,
    type: "error" as NotificationType,
  }),

  transactionRejected: (amount: number, type: string) => ({
    title: "Transaction Rejected",
    message: `Your ${type} transaction of $${amount.toFixed(2)} was rejected. Please contact support if you have questions.`,
    type: "error" as NotificationType,
  }),

  depositReceived: (amount: number, accountNumber: string) => ({
    title: "Deposit Received",
    message: `$${amount.toFixed(2)} has been deposited into your account ending in ${accountNumber.slice(-4)}.`,
    type: "success" as NotificationType,
  }),

  withdrawalProcessed: (amount: number) => ({
    title: "Withdrawal Processed",
    message: `Your withdrawal of $${amount.toFixed(2)} has been processed successfully.`,
    type: "success" as NotificationType,
  }),

  transferCompleted: (amount: number, recipient: string) => ({
    title: "Transfer Completed",
    message: `$${amount.toFixed(2)} has been successfully transferred to ${recipient}.`,
    type: "success" as NotificationType,
  }),

  transferFailed: (amount: number) => ({
    title: "Transfer Failed",
    message: `Your transfer of $${amount.toFixed(2)} could not be completed. Please try again or contact support.`,
    type: "error" as NotificationType,
  }),

  largeTransaction: (amount: number, type: string) => ({
    title: "Large Transaction Alert",
    message: `A ${type} of $${amount.toFixed(2)} has been processed on your account.`,
    type: "info" as NotificationType,
  }),

  // Account Application notifications
  accountApplicationApproved: () => ({
    title: "Account Application Approved",
    message: "Congratulations! Your account application has been approved. You can now access all banking features.",
    type: "success" as NotificationType,
  }),

  accountApplicationRejected: () => ({
    title: "Account Application Rejected",
    message: "Unfortunately, your account application was not approved at this time. Please contact support for more information.",
    type: "error" as NotificationType,
  }),

  // Account Request notifications
  accountRequestApproved: (accountType: string) => ({
    title: "Account Request Approved",
    message: `Your ${accountType} account request has been approved. Your new account is now active.`,
    type: "success" as NotificationType,
  }),

  accountRequestRejected: (accountType: string) => ({
    title: "Account Request Rejected",
    message: `Your ${accountType} account request was not approved. Contact support for details.`,
    type: "error" as NotificationType,
  }),

  // Card Application notifications
  cardApplicationApproved: (cardType: string) => ({
    title: "Card Application Approved",
    message: `Your ${cardType} card application has been approved. Your card will arrive in 7-10 business days.`,
    type: "success" as NotificationType,
  }),

  cardApplicationRejected: (cardType: string) => ({
    title: "Card Application Rejected",
    message: `Your ${cardType} card application was not approved at this time.`,
    type: "error" as NotificationType,
  }),

  // Loan Application notifications
  loanApplicationApproved: (amount: number, loanType: string) => ({
    title: "Loan Application Approved",
    message: `Your ${loanType} loan application for $${amount.toFixed(2)} has been approved. Funds will be disbursed shortly.`,
    type: "success" as NotificationType,
  }),

  loanApplicationRejected: (loanType: string) => ({
    title: "Loan Application Rejected",
    message: `Your ${loanType} loan application was not approved. Please contact support for more information.`,
    type: "error" as NotificationType,
  }),

  profileUpdated: () => ({
    title: "Profile Updated",
    message: "Your profile information has been successfully updated.",
    type: "success" as NotificationType,
  }),

  // Security
  loginDetected: (location: string, device: string) => ({
    title: "New Login Detected",
    message: `A login was detected from ${device} in ${location}. If this wasn't you, please secure your account immediately.`,
    type: "warning" as NotificationType,
  }),

  passwordChanged: () => ({
    title: "Password Changed",
    message: "Your password has been successfully changed. If you didn't make this change, contact support immediately.",
    type: "success" as NotificationType,
  }),

  securityAlert: (reason: string) => ({
    title: "Security Alert",
    message: `Security alert: ${reason}. Please review your account activity.`,
    type: "warning" as NotificationType,
  }),

  twoFactorEnabled: () => ({
    title: "Two-Factor Authentication Enabled",
    message: "Two-factor authentication has been successfully enabled on your account.",
    type: "success" as NotificationType,
  }),

  // Payments & Bills
  paymentDue: (amount: number, payee: string, dueDate: string) => ({
    title: "Payment Due Soon",
    message: `Your payment of $${amount.toFixed(2)} to ${payee} is due on ${dueDate}.`,
    type: "warning" as NotificationType,
  }),

  paymentProcessed: (amount: number, payee: string) => ({
    title: "Payment Processed",
    message: `Your payment of $${amount.toFixed(2)} to ${payee} has been processed successfully.`,
    type: "success" as NotificationType,
  }),

  cardDeclined: (merchant: string) => ({
    title: "Card Declined",
    message: `Your card was declined at ${merchant}. Please check your account balance or contact support.`,
    type: "error" as NotificationType,
  }),

  cardPurchase: (amount: number, merchant: string) => ({
    title: "Card Purchase",
    message: `A purchase of $${amount.toFixed(2)} was made at ${merchant}.`,
    type: "info" as NotificationType,
  }),

  // Other
  documentRequired: (documentType: string) => ({
    title: "Document Required",
    message: `Please upload your ${documentType} to complete your account verification.`,
    type: "warning" as NotificationType,
  }),

  maintenanceScheduled: (date: string) => ({
    title: "Scheduled Maintenance",
    message: `System maintenance is scheduled for ${date}. Some services may be temporarily unavailable.`,
    type: "info" as NotificationType,
  }),

  promotionAvailable: (promoName: string) => ({
    title: "Special Offer Available",
    message: `Check out our ${promoName} promotion! Limited time offer.`,
    type: "info" as NotificationType,
  }),
};

/**
 * Bulk create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    }));

    const { error } = await supabase.from("alerts").insert(notifications);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error };
  }
}
