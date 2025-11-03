import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
          from: "VaultBank <onboarding@resend.dev>",
          to: [user.email!],
          subject: "Verify Your VaultBank Account",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .button { display: inline-block; padding: 12px 30px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .info-box { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Welcome to VaultBank, ${fullName}!</h1>
                  <p>Thank you for creating your account. Please verify your email address to continue:</p>
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                  <div class="info-box">
                    <p><strong>📧 Verification Email Sent</strong></p>
                    <p>A verification email has been automatically sent to ${user.email}. Please check your inbox (and spam folder) and click the verification link.</p>
                  </div>
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
                  <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <strong>Next Steps:</strong><br>
                    1. Click the verification link above<br>
                    2. Sign in to your account<br>
                    3. Our admin team will review your application (1-2 business days)<br>
                    4. Once approved, full account access will be granted
                  </p>
                </div>
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
