import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountApplicationRequest {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  residentialAddress: string;
  accountType: string;
  ssn: string;
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const applicationData: AccountApplicationRequest = await req.json();

    // Generate QR secret
    const qrSecret = crypto.randomUUID();

    // Create the user account
    console.log('Creating account for:', applicationData.email);
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: applicationData.email,
      password: applicationData.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        full_name: applicationData.fullName,
      }
    });

    if (signUpError) {
      console.error('SignUp error:', signUpError);
      
      // Handle specific error cases with appropriate status codes
      if (signUpError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "An account with this email already exists. Please sign in instead." 
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: signUpError.message 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!signUpData.user) {
      throw new Error("Failed to create user account");
    }

    const userId = signUpData.user.id;
    console.log('User created successfully:', userId);

    // Insert application into database (using service role, bypasses RLS)
    const { error: appError } = await supabaseAdmin
      .from("account_applications")
      .insert({
        user_id: userId,
        full_name: applicationData.fullName,
        date_of_birth: applicationData.dateOfBirth,
        email: applicationData.email,
        phone: applicationData.phoneNumber,
        address: applicationData.residentialAddress,
        account_type: applicationData.accountType,
        ssn: applicationData.ssn,
        status: 'pending',
        email_verified: false,
        qr_code_secret: qrSecret,
        verification_token: userId,
      });

    if (appError) {
      console.error("Error submitting application:", appError);
      throw new Error(appError.message);
    }

    // Update profile with security info
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        pin: applicationData.pin,
        security_question: applicationData.securityQuestion,
        security_answer: applicationData.securityAnswer,
        phone: applicationData.phoneNumber,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't throw, this is not critical
    }

    // Supabase automatically sends verification email because email_confirm: false
    console.log('Supabase will send verification email automatically');

    console.log('Application submitted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created successfully. Please check your email to verify.",
        userId: userId
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-account-application:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to create account" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
