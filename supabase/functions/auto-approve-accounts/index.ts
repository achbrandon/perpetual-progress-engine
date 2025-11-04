import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending account requests older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('account_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo);

    if (fetchError) {
      console.error('Error fetching pending requests:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending requests to process' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const processedAccounts = [];

    for (const request of pendingRequests) {
      try {
        // Generate account number
        const accountNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const routingNumber = '021000021';

        // Create the account
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: request.user_id,
            account_type: request.account_type,
            account_name: `${request.account_type.charAt(0).toUpperCase() + request.account_type.slice(1)} Account`,
            account_number: accountNumber,
            routing_number: routingNumber,
            balance: 0,
            available_balance: 0,
            status: 'active',
            currency: 'USD'
          })
          .select()
          .single();

        if (accountError) {
          console.error(`Error creating account for request ${request.id}:`, accountError);
          continue;
        }

        // Update the request status
        await supabase
          .from('account_requests')
          .update({
            status: 'approved',
            processed_at: new Date().toISOString(),
            auto_approved: true
          })
          .eq('id', request.id);

        // Create notification for user
        await supabase
          .from('admin_notifications')
          .insert({
            notification_type: 'account_approved',
            message: `Your ${request.account_type} account has been automatically approved and created`,
            user_id: request.user_id
          });

        processedAccounts.push({
          request_id: request.id,
          account_id: newAccount.id,
          account_type: request.account_type
        });

      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Auto-approval process completed',
        processed: processedAccounts.length,
        accounts: processedAccounts
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in auto-approve-accounts function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
