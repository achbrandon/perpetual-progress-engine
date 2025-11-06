import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  email: string;
  fullName: string;
  verificationToken: string;
  qrSecret: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!sendgridApiKey) {
      console.log("SENDGRID_API_KEY not configured - email functionality disabled");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Please add SENDGRID_API_KEY to continue." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, fullName, verificationToken, qrSecret, redirectUrl }: VerificationRequest & { redirectUrl?: string } = await req.json();

    console.log("📧 Preparing email for:", email);

    // Generate QR code as SVG (works in Deno without canvas)
    const qrCodeSvg = await QRCode.toString(qrSecret, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log("✅ QR code generated successfully");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your VaultBank Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td style="padding: 48px 48px 32px; text-align: center; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <div style="display: inline-block; padding: 16px 32px; background-color: rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
                                🏦 VaultBank
                              </h1>
                            </div>
                            <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 15px; font-weight: 500; letter-spacing: 0.5px;">
                              SECURE BANKING PLATFORM
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 48px 48px 32px;">
                       <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        Welcome to VaultBank, ${fullName}! 👋
                       </h2>
                       
                        <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                        Thank you for opening an account with VaultBank. Your account has been successfully created and is now under review by our team.
                        </p>
                        
                        <!-- Action Required Box -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 32px 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);">
                          <p style="margin: 0 0 12px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            🔐 Security Setup Required
                          </p>
                          <p style="margin: 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500; line-height: 1.6;">
                            To secure your account, please save the QR code below and use it to complete your verification when you sign in.
                          </p>
                        </div>

                        <!-- Two-Factor Authentication Section -->
                        <div style="margin: 40px 0; padding: 32px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; border: 2px solid #e2e8f0;">
                          <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 700;">
                            🔐 Your Security Code
                          </h3>
                          
                          <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 1.7;">
                            Save this security code. You will need it to complete your account verification after signing in to VaultBank:
                          </p>
                        
                        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                          <tr>
                            <td align="center" style="padding: 24px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                              <div style="display: inline-block; max-width: 280px; width: 100%;">
                                ${qrCodeSvg}
                              </div>
                              
                              <div style="margin-top: 20px; padding: 16px; background-color: #f7fafc; border-radius: 6px;">
                                <p style="margin: 0 0 8px; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Manual Entry Code
                                </p>
                                <code style="display: block; padding: 12px; background-color: #ffffff; border: 2px dashed #cbd5e0; border-radius: 6px; color: #2d3748; font-size: 14px; font-family: 'Courier New', monospace; word-break: break-all; line-height: 1.5;">
                                  ${qrSecret}
                                </code>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>

                        <!-- Security Notice -->
                        <div style="margin: 32px 0; padding: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.7;">
                            <strong>⚠️ Security Information:</strong> Keep this security code safe and secure. Your account is currently under review by our team. Once approved, you will use this code to complete your account verification. Never share this code with anyone.
                          </p>
                        </div>

                       <!-- Next Steps -->
                       <div style="margin: 32px 0;">
                         <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 700;">
                           📋 Next Steps:
                         </h3>
                         <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                           <tr>
                             <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                 <strong style="color: #667eea; font-weight: 700;">1.</strong> Save your security code from this email
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                 <strong style="color: #667eea; font-weight: 700;">2.</strong> Wait for account approval (usually within 24-48 hours)
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                 <strong style="color: #667eea; font-weight: 700;">3.</strong> Sign in to your account at vaultbankonline.com
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 12px 0;">
                               <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                 <strong style="color: #667eea; font-weight: 700;">4.</strong> Enter your security code to complete verification
                               </p>
                             </td>
                           </tr>
                         </table>
                       </div>

                        <!-- Support -->
                        <div style="margin: 32px 0 0; padding-top: 24px; border-top: 2px solid #e2e8f0;">
                          <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.7;">
                            <strong>Need Help?</strong> If you didn't request this account or need assistance, please contact our support team at support@vaultbankonline.com. This is a legitimate account confirmation email from VaultBank.
                          </p>
                        </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 48px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-top: 1px solid #e2e8f0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px; font-weight: 700;">
                              🏦 VaultBank
                            </p>
                            <p style="margin: 0 0 8px; color: #4a5568; font-size: 13px; font-weight: 500;">
                              Secure • Reliable • Trusted
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                              This is an automated security email. Please do not reply.<br>
                              © 2025 VaultBank. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Convert HTML to plain text for better deliverability
    const plainText = emailHtml
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Send email using SendGrid API with anti-spam features
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: "VaultBank - Your Security Code Inside"
        }],
        from: {
          email: "info@vaulteonline.com",
          name: "VaultBank Security"
        },
        reply_to: {
          email: "support@vaultbankonline.com",
          name: "VaultBank Support Team"
        },
        content: [
          {
            type: "text/plain",
            value: plainText
          },
          {
            type: "text/html",
            value: emailHtml
          }
        ],
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: false
          },
          open_tracking: {
            enable: true
          },
          subscription_tracking: {
            enable: false
          }
        },
        mail_settings: {
          bypass_list_management: {
            enable: false
          },
          footer: {
            enable: false
          },
          sandbox_mode: {
            enable: false
          }
        },
        categories: ["account-verification", "security"],
        custom_args: {
          security_type: "email_verification",
          verification_version: "v2"
        }
      })
    });

    // Log the complete response for debugging
    const responseBody = await emailResponse.text();
    console.log("SendGrid Response Status:", emailResponse.status);
    console.log("SendGrid Response Headers:", Object.fromEntries(emailResponse.headers.entries()));
    console.log("SendGrid Response Body:", responseBody);

    if (!emailResponse.ok) {
      console.error("SendGrid API error - Full response:", responseBody);
      throw new Error(`SendGrid API error: ${emailResponse.status} - ${responseBody}`);
    }

    // SendGrid returns 202 Accepted - this means it accepted the request, not that it delivered
    console.log("✅ SendGrid accepted email request (Status: 202)");
    console.log("📧 Email sent to:", email);
    console.log("⚠️ Note: Check SendGrid Activity Feed if email doesn't arrive");

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
