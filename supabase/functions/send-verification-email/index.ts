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
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px; color: #333;">
          <p>Hello ${fullName},</p>
          <p>Your VaultBank account has been created.</p>
          <p>Your authentication code:</p>
          <p style="font-size: 18px; font-weight: bold; padding: 10px; background: #f5f5f5;">${qrSecret}</p>
          <p>Save this code. You will need it to access your account.</p>
          <p>VaultBank</p>
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
          subject: "Your VaultBank Account Code"
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
