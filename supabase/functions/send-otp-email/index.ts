import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
  action: 'login' | 'transfer' | 'withdrawal' | 'link_account' | 'domestic_transfer' | 'international_transfer' | 'crypto_withdrawal';
  accountType?: string;
  accountIdentifier?: string;
  amount?: string;
  currency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const { email, otp, action = 'link_account', accountType, accountIdentifier, amount, currency }: OTPEmailRequest = await req.json();

    console.log(`Sending OTP to ${email} for action: ${action}`);

    // Generate email content based on action
    const getEmailContent = () => {
      switch (action) {
        case 'login':
          return {
            subject: 'VaultBank Login Verification Code',
            title: '🔐 Login Verification',
            description: 'You are attempting to log in to your VaultBank account.',
            instruction: 'If you initiated this login request, please use the verification code below to complete your login:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to access your account.',
            warning: 'If you did not attempt to log in, please ignore this email and consider changing your password immediately.'
          };
        
        case 'transfer':
          return {
            subject: 'VaultBank Transfer Verification Code',
            title: '💸 Transfer Verification',
            description: `You are initiating a transfer${amount ? ` of $${amount}` : ''} from your VaultBank account.`,
            instruction: 'To complete this transfer, please use the verification code below:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to authorize the transfer.',
            warning: 'If you did not initiate this transfer, please contact our support team immediately.'
          };
        
        case 'crypto_withdrawal':
          return {
            subject: 'VaultBank Crypto Withdrawal Verification',
            title: '🪙 Crypto Withdrawal Verification',
            description: `You are withdrawing${currency ? ` ${currency}` : ' cryptocurrency'}${amount ? ` ($${amount})` : ''} from your VaultBank account.`,
            instruction: 'To complete this crypto withdrawal, please use the verification code below:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to authorize the withdrawal.',
            warning: 'Crypto transactions are irreversible. If you did not initiate this withdrawal, please contact support immediately.'
          };
        
        case 'domestic_transfer':
          return {
            subject: 'VaultBank Domestic Wire Verification',
            title: '🏦 Domestic Wire Transfer Verification',
            description: `You are initiating a domestic wire transfer${amount ? ` of $${amount}` : ''}.`,
            instruction: 'To complete this wire transfer, please use the verification code below:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to authorize the transfer.',
            warning: 'If you did not initiate this wire transfer, please contact our support team immediately.'
          };
        
        case 'international_transfer':
          return {
            subject: 'VaultBank International Wire Verification',
            title: '🌍 International Wire Transfer Verification',
            description: `You are initiating an international wire transfer${amount ? ` of $${amount}` : ''}.`,
            instruction: 'To complete this international transfer, please use the verification code below:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to authorize the transfer.',
            warning: 'International transfers may incur additional fees. If you did not initiate this transfer, please contact support immediately.'
          };
        
        case 'withdrawal':
          return {
            subject: 'VaultBank Withdrawal Verification',
            title: '💰 Withdrawal Verification',
            description: `You are withdrawing${amount ? ` $${amount}` : ' funds'} from your VaultBank account.`,
            instruction: 'To complete this withdrawal, please use the verification code below:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to authorize the withdrawal.',
            warning: 'If you did not initiate this withdrawal, please contact our support team immediately.'
          };
        
        case 'link_account':
        default:
          return {
            subject: 'VaultBank Account Link Verification',
            title: '🔗 External Payment Account Link Request',
            description: `${accountType ? `Your account is being linked to <strong>${accountType.charAt(0).toUpperCase() + accountType.slice(1)}</strong>` : 'A payment account is being linked to your VaultBank account'} ${accountIdentifier ? `(${accountIdentifier})` : ''}.`,
            instruction: 'If you initiated this request, please use the verification code below to complete the linking process:',
            expiry: 'This code will expire in <strong>10 minutes</strong>. Enter this code to complete the account linking.',
            warning: 'If you did not initiate this account linking, please contact our support team immediately.'
          };
      }
    };

    const emailContent = getEmailContent();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VaultBank OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">VaultBank</h1>
                      <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px;">Security Verification</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${emailContent.title}</h2>
                      <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 24px;">
                        ${emailContent.description}
                      </p>
                      <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 24px;">
                        ${emailContent.instruction}
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
                        <tr>
                          <td style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 24px; text-align: center;">
                            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                              ${otp}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px; line-height: 20px;">
                        ${emailContent.expiry}
                      </p>
                      
                      <!-- Security Warning Box -->
                      <div style="margin: 24px 0 16px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #856404; font-size: 14px; font-weight: 600;">
                          ⚠️ Security Alert
                        </p>
                        <p style="margin: 0 0 8px 0; color: #856404; font-size: 13px; line-height: 18px;">
                          <strong>Never share this code with anyone.</strong> VaultBank staff will never ask for your verification code.
                        </p>
                      </div>

                      <!-- Unauthorized Access Warning -->
                      <div style="margin: 16px 0 0 0; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #721c24; font-size: 14px; font-weight: 600;">
                          🚨 Did Not Initiate This Request?
                        </p>
                        <p style="margin: 0 0 12px 0; color: #721c24; font-size: 13px; line-height: 20px;">
                          ${emailContent.warning}
                        </p>
                        <ul style="margin: 0; padding-left: 20px; color: #721c24; font-size: 13px; line-height: 20px;">
                          <li style="margin: 4px 0;">🔒 <strong>Change your password immediately</strong> by logging into your account</li>
                          <li style="margin: 4px 0;">✉️ <strong>Contact our support team</strong> at info@vaulteonline.com</li>
                          <li style="margin: 4px 0;">🔐 <strong>Review your linked accounts</strong> in Settings → Linked Accounts</li>
                          <li style="margin: 4px 0;">❌ <strong>Remove any unauthorized accounts</strong> from your profile</li>
                          <li style="margin: 4px 0;">📧 <strong>Enable two-factor authentication</strong> for extra security</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #f8f9fa;">
                      <p style="margin: 0 0 8px 0; color: #999999; font-size: 12px; line-height: 18px;">
                        This is an automated message from VaultBank. Please do not reply to this email.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px;">
                        © 2025 VaultBank. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Convert HTML to plain text for better email deliverability
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
        }],
        from: {
          email: "info@vaulteonline.com",
          name: "VaultBank Security"
        },
        subject: emailContent.subject,
        content: [
          {
            type: "text/plain",
            value: textContent
          },
          {
            type: "text/html",
            value: htmlContent
          }
        ],
        tracking_settings: {
          click_tracking: { enable: false },
          open_tracking: { enable: false }
        }
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid API error:", errorText);
      throw new Error(`SendGrid API error: ${sendGridResponse.status}`);
    }

    console.log("Email sent successfully via SendGrid");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
