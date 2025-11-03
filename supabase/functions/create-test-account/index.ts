import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create test user with known credentials
    const testEmail = `test${Date.now()}@vaultbank.com`;
    const testPassword = "Test123456!";
    const testPin = "1234";
    
    console.log('Creating test user...');
    
    // Create user with admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: "Test User"
      }
    });

    if (userError) throw userError;
    
    console.log('User created:', userData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: "Test User",
        email: testEmail,
        email_verified: true,
        security_pin: testPin,
        qr_secret: "test-secret"
      });

    if (profileError) throw profileError;
    
    console.log('Profile created');

    // Create checking account with money
    const { error: checkingError } = await supabase
      .from('accounts')
      .insert({
        user_id: userData.user.id,
        account_type: 'checking',
        account_number: '1000' + Math.floor(Math.random() * 1000000),
        routing_number: '021000021',
        balance: 50000.00,
        status: 'active'
      });

    if (checkingError) throw checkingError;

    // Create savings account with money
    const { error: savingsError } = await supabase
      .from('accounts')
      .insert({
        user_id: userData.user.id,
        account_type: 'savings',
        account_number: '2000' + Math.floor(Math.random() * 1000000),
        routing_number: '021000021',
        balance: 100000.00,
        status: 'active'
      });

    if (savingsError) throw savingsError;

    console.log('Accounts created with balances');

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email: testEmail,
          password: testPassword,
          pin: testPin
        },
        message: "Test account created successfully with $50,000 in checking and $100,000 in savings"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error creating test account:', error);
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
