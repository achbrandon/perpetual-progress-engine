import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationDecisionRequest {
  applicantName: string;
  applicantEmail: string;
  applicationType: "account" | "card" | "loan";
  decision: "approved" | "rejected";
  accountType?: string;
  cardType?: string;
  loanAmount?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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

    const {
      applicantName,
      applicantEmail,
      applicationType,
      decision,
      accountType,
      cardType,
      loanAmount,
    }: ApplicationDecisionRequest = await req.json();

    console.log("Processing application decision email:", {
      applicantEmail,
      applicationType,
      decision,
    });

    // Customize email based on application type and decision
    let subject = "";
    let htmlContent = "";

    if (decision === "approved") {
      switch (applicationType) {
        case "account":
          subject = "Your VaultBank Account Application Has Been Approved";
          htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 40px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Application Approved</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Hello ${applicantName},
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              We're excited to inform you that your ${accountType} account application has been approved!
                            </p>
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; padding: 20px; margin: 24px 0;">
                              <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.7;">
                                <strong>Application Status:</strong> Approved<br>
                                <strong>Account Type:</strong> ${accountType}<br>
                                <strong>Setup Time:</strong> 24-48 hours
                              </p>
                            </div>
                            <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: 600;">
                              What's Next?
                            </p>
                            <p style="margin: 0 0 12px; color: #333333; font-size: 15px; line-height: 1.6;">
                              • Your account will be fully activated within 24-48 hours<br>
                              • You can now access your account<br>
                              • Download our mobile app for easy access on the go
                            </p>
                            <p style="margin: 24px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                              Thank you,<br>
                              VaultBank Team
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                              VaultBank Financial<br>
                              806 E Exchange St, Brodhead, WI 53520
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
          break;
        case "card":
          subject = "Your VaultBank Card Application Has Been Approved";
          htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 40px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Card Application Approved</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Hello ${applicantName},
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Your ${cardType} card application has been approved!
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Your new card will be mailed to your address within 5-7 business days.
                            </p>
                            <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: 600;">
                              What to Expect:
                            </p>
                            <p style="margin: 0 0 12px; color: #333333; font-size: 15px; line-height: 1.6;">
                              • Your card will arrive in a secure envelope<br>
                              • Activate your card online or by phone<br>
                              • Start enjoying your card benefits immediately after activation
                            </p>
                            <p style="margin: 24px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                              Thank you,<br>
                              VaultBank Team
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                              VaultBank Financial<br>
                              806 E Exchange St, Brodhead, WI 53520
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
          break;
        case "loan":
          subject = "Your VaultBank Loan Application Has Been Approved";
          htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 40px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Loan Application Approved</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Hello ${applicantName},
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              We're pleased to inform you that your loan application for $${loanAmount?.toLocaleString()} has been approved!
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Our loan specialist will contact you within 1-2 business days to finalize the details.
                            </p>
                            <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: 600;">
                              Next Steps:
                            </p>
                            <p style="margin: 0 0 12px; color: #333333; font-size: 15px; line-height: 1.6;">
                              • Review your loan terms and conditions<br>
                              • Complete any required documentation<br>
                              • Set up your payment schedule
                            </p>
                            <p style="margin: 24px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                              Thank you,<br>
                              VaultBank Team
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                              VaultBank Financial<br>
                              806 E Exchange St, Brodhead, WI 53520
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
          break;
      }
    } else {
      // Rejected
      subject = `Update on Your VaultBank Application`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Application Update</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Hello ${applicantName},
                        </p>
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Thank you for your interest in VaultBank. After careful review, we regret to inform you that we are unable to approve your ${applicationType} application at this time.
                        </p>
                        <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: 600;">
                          What You Can Do:
                        </p>
                        <p style="margin: 0 0 12px; color: #333333; font-size: 15px; line-height: 1.6;">
                          • Review your credit report for accuracy<br>
                          • Consider reapplying after addressing any financial concerns<br>
                          • Contact us to discuss alternative options
                        </p>
                        <p style="margin: 24px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                          Sincerely,<br>
                          VaultBank Team
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                          VaultBank Financial<br>
                          806 E Exchange St, Brodhead, WI 53520
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
    }

    // Send email using SendGrid API
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: applicantEmail }],
          subject: subject
        }],
        from: {
          email: "noreply@vaulteonline.com",
          name: "VaultBank"
        },
        content: [{
          type: "text/html",
          value: htmlContent
        }]
      })
    });

    const responseBody = await emailResponse.text();
    console.log("SendGrid Response Status:", emailResponse.status);

    if (!emailResponse.ok) {
      console.error("SendGrid API error:", responseBody);
      throw new Error(`SendGrid API error: ${emailResponse.status}`);
    }

    console.log("✅ Application decision email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-application-decision function:", error);
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
