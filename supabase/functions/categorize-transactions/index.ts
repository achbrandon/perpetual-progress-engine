import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string | null;
  type: string;
  amount: number;
}

// Small amount descriptions (< $100)
const SMALL_AMOUNT_DESCRIPTIONS: string[] = [
  'Coffee shop',
  'Lunch at local restaurant',
  'Dinner',
  'Breakfast',
  'Market purchase',
  'Gas station',
  'Parking',
  'Dolmuş fare',
  'Fast food',
  'Pharmacy',
  'Bakkal (convenience store)',
  'Food delivery',
  'Kebab shop',
  'Cafe',
  'Bakery',
  'Manav (greengrocer)',
  'Pazar (market)',
  'Tekel shop',
  'Macro',
  'A101',
  'BIM',
  'Şok Market',
  'CarrefourSA',
  'Lemar',
  'Metro Market',
  'Local grocery',
  'Street vendor',
  'Simit stand'
];

// Large amount descriptions (>= $100)
const LARGE_AMOUNT_DESCRIPTIONS: string[] = [
  'Investment transfer',
  'Property payment',
  'Insurance premium',
  'Medical services',
  'Legal fees',
  'Consulting services',
  'Business payment',
  'Equipment purchase',
  'Contractor payment',
  'Professional services',
  'Real estate payment',
  'Investment deposit',
  'Business supplies',
  'Home improvement',
  'Vehicle maintenance',
  'Electronics purchase',
  'Furniture purchase',
  'Rent'
];

function generateDescription(type: string, amount: number): string {
  // For transfers and withdrawals, use appropriate descriptions based on amount
  if (type === 'transfer' || type === 'withdrawal') {
    if (amount >= 100) {
      const largeTransferDescriptions = [
        'Investment portfolio transfer',
        'Account transfer',
        'Investment withdrawal',
        'Business transfer',
        'Savings transfer'
      ];
      return largeTransferDescriptions[Math.floor(Math.random() * largeTransferDescriptions.length)];
    } else {
      const smallTransferDescriptions = [
        'Transfer to savings',
        'Money transfer',
        'Account transfer',
        'Payment sent'
      ];
      return smallTransferDescriptions[Math.floor(Math.random() * smallTransferDescriptions.length)];
    }
  }
  
  // For other transactions, assign based on amount
  if (amount < 100) {
    return SMALL_AMOUNT_DESCRIPTIONS[Math.floor(Math.random() * SMALL_AMOUNT_DESCRIPTIONS.length)];
  } else {
    return LARGE_AMOUNT_DESCRIPTIONS[Math.floor(Math.random() * LARGE_AMOUNT_DESCRIPTIONS.length)];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting transaction categorization...');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';

    // Fetch transactions that need categorization (empty or generic descriptions)
    let query = supabase
      .from('transactions')
      .select('id, description, type, amount, user_id');

    // If not admin, only update their own transactions
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: transactions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${transactions?.length || 0} transactions to process`);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No transactions to categorize',
          updated: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transactions with better descriptions
    let updatedCount = 0;
    const errors: string[] = [];

    for (const txn of transactions) {
      // Skip if already has a good description
      if (txn.description && 
          (txn.description.toLowerCase().includes('restaurant') ||
           txn.description.toLowerCase().includes('shopping') ||
           txn.description.toLowerCase().includes('uber') ||
           txn.description.toLowerCase().includes('bill') ||
           txn.description.toLowerCase().includes('coffee'))) {
        continue;
      }

      const newDescription = generateDescription(txn.type, Math.abs(Number(txn.amount)));
      
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ description: newDescription })
        .eq('id', txn.id);

      if (updateError) {
        console.error(`Error updating transaction ${txn.id}:`, updateError);
        errors.push(`Transaction ${txn.id}: ${updateError.message}`);
      } else {
        updatedCount++;
        console.log(`Updated transaction ${txn.id} with: ${newDescription}`);
      }
    }

    console.log(`Categorization complete. Updated ${updatedCount} transactions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully categorized ${updatedCount} transactions`,
        updated: updatedCount,
        total: transactions.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-transactions function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
