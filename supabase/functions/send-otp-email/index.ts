import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
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

    const { email, otp }: OTPEmailRequest = await req.json();

    console.log(`Sending OTP to ${email}`);

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
                      <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Transfer Verification Code</h2>
                      <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 24px;">
                        You've requested to make a transfer. Please use the verification code below to complete your transaction:
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
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email or contact our support team.
                      </p>
                      
                      <div style="margin: 24px 0 0 0; padding: 16px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 13px; line-height: 18px;">
                          <strong>Security Tip:</strong> Never share this code with anyone. VaultBank staff will never ask for your verification code.
                        </p>
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
          email: "noreply@vaultbank.com",
          name: "VaultBank Security"
        },
        subject: "Your VaultBank Transfer Verification Code",
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
