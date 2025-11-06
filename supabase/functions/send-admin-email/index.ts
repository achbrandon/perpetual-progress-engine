import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipientIds?: string[];
  manualEmails?: string[];
  subject: string;
  htmlContent: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!sendgridApiKey) {
      console.log("SENDGRID_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { recipientIds = [], manualEmails = [], subject, htmlContent }: EmailRequest = await req.json();

    console.log("Processing bulk email send:", {
      recipientIdCount: recipientIds.length,
      manualEmailCount: manualEmails.length,
      subject,
    });

    let emailList: Array<{ email: string; full_name?: string }> = [];

    // Fetch recipient emails from user IDs if provided
    if (recipientIds.length > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("id", recipientIds);

      if (profilesError) throw profilesError;
      if (profiles && profiles.length > 0) {
        emailList = [...emailList, ...profiles];
      }
    }

    // Add manual emails
    if (manualEmails.length > 0) {
      const manualRecipients = manualEmails.map(email => ({ email, full_name: undefined }));
      emailList = [...emailList, ...manualRecipients];
    }

    if (emailList.length === 0) {
      throw new Error("No valid recipients found");
    }

    console.log(`Sending to ${emailList.length} recipients`);

    // Send emails using SendGrid
    const emailPromises = emailList.map(async (recipient) => {
      if (!recipient.email) return { success: false, email: "no-email" };

      try {
        // Convert HTML to plain text for better deliverability
        const plainText = htmlContent
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendgridApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: recipient.email }],
              subject: subject
            }],
            from: {
              email: "info@vaulteonline.com",
              name: "VaultBank"
            },
            reply_to: {
              email: "info@vaulteonline.com",
              name: "VaultBank Support"
            },
            content: [
              {
                type: "text/plain",
                value: plainText
              },
              {
                type: "text/html",
                value: htmlContent
              }
            ],
            tracking_settings: {
              click_tracking: {
                enable: true
              },
              open_tracking: {
                enable: true
              }
            },
            mail_settings: {
              bypass_list_management: {
                enable: false
              }
            }
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send to ${recipient.email}:`, errorText);
          return { success: false, email: recipient.email, error: errorText };
        }

        console.log(`✅ Email sent to ${recipient.email}`);
        return { success: true, email: recipient.email };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error sending to ${recipient.email}:`, error);
        return { success: false, email: recipient.email, error: errorMessage };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email send complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        successCount, 
        failureCount,
        totalRecipients: emailList.length
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-email function:", error);
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
