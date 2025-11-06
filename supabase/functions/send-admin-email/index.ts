import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipientIds: string[];
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

    const { recipientIds, subject, htmlContent }: EmailRequest = await req.json();

    console.log("Processing bulk email send:", {
      recipientCount: recipientIds.length,
      subject,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recipient emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", recipientIds);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      throw new Error("No valid recipients found");
    }

    console.log(`Sending to ${profiles.length} recipients`);

    // Send emails using SendGrid
    const emailPromises = profiles.map(async (profile) => {
      if (!profile.email) return { success: false, email: "no-email" };

      try {
        const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendgridApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: profile.email }],
              subject: subject
            }],
            from: {
              email: "info@vaulteonline.com",
              name: "VaultBank"
            },
            content: [{
              type: "text/html",
              value: htmlContent
            }]
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send to ${profile.email}:`, errorText);
          return { success: false, email: profile.email, error: errorText };
        }

        console.log(`✅ Email sent to ${profile.email}`);
        return { success: true, email: profile.email };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error sending to ${profile.email}:`, error);
        return { success: false, email: profile.email, error: errorMessage };
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
        totalRecipients: profiles.length 
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
