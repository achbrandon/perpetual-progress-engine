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
          <title>VaultBank Account Setup</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td style="padding: 40px 40px 24px; text-align: center; background-color: #1a1a1a;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        VaultBank
                      </h1>
                      <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                        Secure Banking Platform
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                       <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px; font-weight: 600; line-height: 1.3;">
                        Welcome to VaultBank, ${fullName}
                       </h2>
                       
                        <p style="margin: 0 0 20px; color: #4a5568; font-size: 15px; line-height: 1.6;">
                        Your account application has been received and is currently under review by our team. We will notify you once your account is approved.
                        </p>

                        <!-- Authentication Code Section -->
                        <div style="margin: 32px 0; padding: 24px; background-color: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                          <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                            Account Authentication Code
                          </h3>
                          
                          <p style="margin: 0 0 20px; color: #4a5568; font-size: 14px; line-height: 1.6;">
                            Save this authentication code securely. You will need it when signing in to your approved account:
                          </p>
                        
                        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                          <tr>
                            <td align="center" style="padding: 20px; background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">
                              <div style="display: inline-block; max-width: 260px; width: 100%;">
                                ${qrCodeSvg}
                              </div>
                              
                              <div style="margin-top: 16px; padding: 12px; background-color: #f7fafc; border-radius: 4px;">
                                <p style="margin: 0 0 6px; color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Authentication Code
                                </p>
                                <code style="display: block; padding: 10px; background-color: #ffffff; border: 1px solid #cbd5e0; border-radius: 4px; color: #2d3748; font-size: 13px; font-family: 'Courier New', monospace; word-break: break-all; line-height: 1.4;">
                                  ${qrSecret}
                                </code>
                              </div>
                            </td>
                          </tr>
                        </table>
                       </div>

                       <!-- Account Setup Process -->
                       <div style="margin: 28px 0;">
                         <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                           Account Setup Process
                         </h3>
                         <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                           <tr>
                             <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                 <strong style="color: #1a1a1a;">Step 1:</strong> Save your authentication code
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                 <strong style="color: #1a1a1a;">Step 2:</strong> Wait for account approval notification
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                               <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                 <strong style="color: #1a1a1a;">Step 3:</strong> Sign in at vaultbankonline.com
                               </p>
                             </td>
                           </tr>
                           <tr>
                             <td style="padding: 10px 0;">
                               <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                 <strong style="color: #1a1a1a;">Step 4:</strong> Enter authentication code when prompted
                               </p>
                             </td>
                           </tr>
                         </table>
                       </div>

                        <!-- Important Notice -->
                        <div style="margin: 24px 0 0; padding: 16px; background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px;">
                          <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                            <strong>Important:</strong> Keep your authentication code confidential. Do not share it with anyone. VaultBank staff will never ask for your authentication code.
                          </p>
                        </div>

                        <!-- Support -->
                        <div style="margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">
                            Questions? Contact us at support@vaultbankonline.com or visit our help center.
                          </p>
                        </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px; font-weight: 600;">
                              VaultBank
                            </p>
                            <p style="margin: 0; color: #a0aec0; font-size: 11px; line-height: 1.5;">
                              This is an automated transactional email. Please do not reply to this message.<br>
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
          subject: "VaultBank Account Application Received"
        }],
        from: {
          email: "noreply@vaulteonline.com",
          name: "VaultBank"
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
