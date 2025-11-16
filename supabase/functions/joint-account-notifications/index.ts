import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  requestId: string;
  stage: string;
  status?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, stage, status }: NotificationPayload = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get joint account request details
    const { data: request, error: requestError } = await supabase
      .from('joint_account_requests')
      .select(`
        *,
        accounts!inner(
          user_id,
          account_number,
          balance
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Joint account request not found');
    }

    // Get primary holder profile
    const { data: primaryProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', request.accounts.user_id)
      .single();

    const primaryUserId = request.accounts.user_id;
    const partnerName = request.partner_full_name;
    const partnerEmail = request.partner_email;
    const accountNumber = request.accounts.account_number;
    const depositAmount = request.deposit_amount;

    // Determine notifications based on stage
    let primaryNotification = '';
    let partnerNotification = '';
    let notificationType = 'info';

    switch (stage) {
      case 'request_submitted':
        primaryNotification = `Joint account request submitted for ${partnerName}. Waiting for partner to complete verification steps.`;
        partnerNotification = `${primaryProfile?.full_name || 'Account holder'} has invited you to join their joint account. Please complete the 1% security deposit and verification process.`;
        break;

      case 'deposit_received':
        primaryNotification = `Partner ${partnerName} has completed the 1% security deposit of $${depositAmount}. Waiting for OTP verification.`;
        partnerNotification = `Your deposit of $${depositAmount} has been received. Please check your email for the OTP verification code.`;
        notificationType = 'success';
        break;

      case 'otp_verified':
        primaryNotification = `${partnerName} has verified their identity via OTP. Waiting for document uploads.`;
        partnerNotification = `OTP verification successful! Please upload your ID documents and proof of address to continue.`;
        notificationType = 'success';
        break;

      case 'documents_uploaded':
        primaryNotification = `${partnerName} has uploaded all required documents. Your joint account request is now under admin review.`;
        partnerNotification = `Documents uploaded successfully! Your joint account application is now being reviewed by our team.`;
        break;

      case 'under_review':
        primaryNotification = `Your joint account request with ${partnerName} is currently under admin review. This typically takes 1-2 business days.`;
        partnerNotification = `Your joint account application with ${primaryProfile?.full_name || 'the primary account holder'} is under review. You'll be notified once approved.`;
        break;

      case 'approved':
        primaryNotification = `Great news! Your joint account request with ${partnerName} has been approved. The account is now active with full access for both holders.`;
        partnerNotification = `Congratulations! Your joint account application has been approved. You now have full access to account ${accountNumber}.`;
        notificationType = 'success';
        break;

      case 'rejected':
        primaryNotification = `Your joint account request with ${partnerName} has been declined. Please contact support for more information.`;
        partnerNotification = `Unfortunately, your joint account application has been declined. Please contact support for details.`;
        notificationType = 'error';
        break;

      case 'activated':
        primaryNotification = `Your joint account with ${partnerName} is now fully activated! Both holders can now make unlimited withdrawals to verified payment methods.`;
        partnerNotification = `Your joint account is now active! You have full access and can withdraw to your pre-verified payment method used for the deposit.`;
        notificationType = 'success';
        break;

      default:
        primaryNotification = `Update on your joint account request with ${partnerName}: ${status || 'Status changed'}`;
        partnerNotification = `Update on your joint account application: ${status || 'Status changed'}`;
    }

    // Insert notification for primary holder
    if (primaryNotification) {
      await supabase
        .from('alerts')
        .insert({
          user_id: primaryUserId,
          title: 'Joint Account Update',
          message: primaryNotification,
          type: notificationType,
          is_read: false
        });
    }

    // Store partner notification details (can be sent via email or when they create account)
    // For now, we'll log this for email sending functionality
    console.log('Partner notification:', {
      email: partnerEmail,
      name: partnerName,
      message: partnerNotification,
      stage
    });

    // Optional: Send email notifications here using Resend
    // This would require the send-notification-email edge function

    return new Response(JSON.stringify({ 
      success: true,
      notificationsSent: {
        primary: primaryNotification,
        partner: partnerNotification
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in joint-account-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
