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

  // Transactions
  depositReceived: (amount: number, accountNumber: string) => ({
    title: "Deposit Received",
    message: `$${amount.toFixed(2)} has been deposited into your account ending in ${accountNumber.slice(-4)}.`,
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

  withdrawalProcessed: (amount: number) => ({
    title: "Withdrawal Processed",
    message: `Your withdrawal of $${amount.toFixed(2)} has been processed successfully.`,
    type: "success" as NotificationType,
  }),

  largeTransaction: (amount: number, type: string) => ({
    title: "Large Transaction Alert",
    message: `A ${type} of $${amount.toFixed(2)} has been processed on your account.`,
    type: "info" as NotificationType,
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
