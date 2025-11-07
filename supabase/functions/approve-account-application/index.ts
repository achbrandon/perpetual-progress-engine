import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  applicationId: string;
  adminUserId: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, adminUserId }: ApprovalRequest = await req.json();

    console.log('Processing approval for application:', applicationId);

    // Get the application
    const { data: app, error: fetchError } = await supabase
      .from('account_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !app) {
      throw new Error('Application not found');
    }

    // Generate unique account number
    const accountNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;

    // Create the account using service role (bypasses RLS)
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: app.user_id,
        account_number: accountNumber,
        account_type: app.account_type,
        balance: 0,
        status: 'active'
      })
      .select()
      .single();

    if (accountError) {
      console.error('Error creating account:', accountError);
      throw accountError;
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('account_applications')
      .update({ status: 'approved' })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      throw updateError;
    }

    // Log admin action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_id: adminUserId,
        action: 'approve_account_application',
        target_user_id: app.user_id,
        details: `Approved ${app.account_type} account application for ${app.full_name}`
      });

    // Send approval email
    try {
      await supabase.functions.invoke('send-application-decision', {
        body: {
          applicantName: app.full_name,
          applicantEmail: app.email,
          applicationType: 'account',
          decision: 'approved',
          accountType: app.account_type,
        },
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application approved successfully',
        accountId: newAccount.id,
        accountNumber: accountNumber
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in approve-account-application:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
