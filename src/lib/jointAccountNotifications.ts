import { supabase } from "@/integrations/supabase/client";

export type JointAccountStage = 
  | 'request_submitted'
  | 'deposit_received'
  | 'otp_verified'
  | 'documents_uploaded'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'activated';

interface SendNotificationParams {
  requestId: string;
  stage: JointAccountStage;
  status?: string;
}

/**
 * Sends automated notifications for joint account approval process stages
 */
export const sendJointAccountNotification = async ({
  requestId,
  stage,
  status
}: SendNotificationParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('joint-account-notifications', {
      body: {
        requestId,
        stage,
        status
      }
    });

    if (error) {
      console.error('Error sending joint account notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send joint account notification:', error);
    throw error;
  }
};

/**
 * Sends notification when joint account request is first submitted
 */
export const notifyRequestSubmitted = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'request_submitted'
  });
};

/**
 * Sends notification when partner completes the 1% deposit
 */
export const notifyDepositReceived = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'deposit_received'
  });
};

/**
 * Sends notification when partner verifies OTP
 */
export const notifyOtpVerified = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'otp_verified'
  });
};

/**
 * Sends notification when partner uploads documents
 */
export const notifyDocumentsUploaded = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'documents_uploaded'
  });
};

/**
 * Sends notification when admin begins review
 */
export const notifyUnderReview = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'under_review'
  });
};

/**
 * Sends notification when joint account is approved
 */
export const notifyApproved = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'approved'
  });
};

/**
 * Sends notification when joint account is rejected
 */
export const notifyRejected = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'rejected'
  });
};

/**
 * Sends notification when joint account is fully activated
 */
export const notifyActivated = (requestId: string) => {
  return sendJointAccountNotification({
    requestId,
    stage: 'activated'
  });
};
