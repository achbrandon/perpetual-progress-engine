import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-complete transactions process...');

    // Find all pending transactions that should be completed
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*, accounts(balance)')
      .eq('status', 'pending')
      .not('auto_complete_at', 'is', null)
      .lte('auto_complete_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingTransactions?.length || 0} transactions to complete`);

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No transactions to complete', completed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let completed = 0;
    let failed = 0;

    // Process each transaction
    for (const transaction of pendingTransactions) {
      try {
        // Get current account balance
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', transaction.account_id)
          .single();

        if (accountError || !account) {
          console.error(`Failed to get account for transaction ${transaction.id}:`, accountError);
          failed++;
          continue;
        }

        const currentBalance = parseFloat(account.balance);
        const amount = parseFloat(transaction.amount);
        const adjustment = transaction.type === 'credit' ? amount : -amount;
        const newBalance = currentBalance + adjustment;

        // Don't complete if would result in negative balance
        if (newBalance < 0) {
          console.error(`Transaction ${transaction.id} would result in negative balance`);
          
          // Update transaction to failed
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transaction.id);
          
          failed++;
          continue;
        }

        // Update account balance
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', transaction.account_id);

        if (balanceError) {
          console.error(`Failed to update balance for transaction ${transaction.id}:`, balanceError);
          failed++;
          continue;
        }

        // Mark transaction as completed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transaction.id);

        if (updateError) {
          console.error(`Failed to update transaction ${transaction.id}:`, updateError);
          failed++;
          continue;
        }

        console.log(`Successfully completed transaction ${transaction.id}`);
        completed++;
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Auto-complete process finished',
        completed,
        failed,
        total: pendingTransactions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in auto-complete-transactions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
