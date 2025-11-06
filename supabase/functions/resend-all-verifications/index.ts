import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get all unverified users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    const unverifiedUsers = users.users.filter(u => !u.email_confirmed_at);
    
    console.log(`Found ${unverifiedUsers.length} unverified users`);

    const results = [];

    for (const user of unverifiedUsers) {
      try {
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const fullName = profile?.full_name || 'Valued Customer';
        const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${user.id}&type=signup`;

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: "VaultBank <noreply@vaulteonline.com>",
          to: [user.email!],
          subject: "Your VaultBank Email is Verified",
          html: `
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
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Email Verified</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Hello ${fullName},
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              Your VaultBank email address has been verified successfully.
                            </p>
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                              You can now access your account.
                            </p>
                            <p style="margin: 0 0 8px; color: #666666; font-size: 14px; line-height: 1.6;">
                              If you did not request this, please contact our support team immediately.
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
          `,
        });

        if (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          results.push({ email: user.email, status: 'failed', error: emailError.message });
        } else {
          console.log(`Successfully sent email to ${user.email}`);
          results.push({ email: user.email, status: 'sent' });
        }
      } catch (error: any) {
        console.error(`Error processing ${user.email}:`, error);
        results.push({ email: user.email, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: unverifiedUsers.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in resend-all-verifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

serve(handler);
