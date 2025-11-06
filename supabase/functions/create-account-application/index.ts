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
  // Document URLs
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  selfieUrl?: string | null;
  driversLicenseUrl?: string | null;
  addressProofUrl?: string | null;
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

    // Create the user account - request email verification
    console.log('Creating account for:', applicationData.email);
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: applicationData.email,
      password: applicationData.password,
      email_confirm: false, // User must verify email via the verification link
      user_metadata: {
        full_name: applicationData.fullName,
      }
    });
    
    console.log('✅ User created with ID:', signUpData?.user?.id);

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

    // Create profile for the user (since there's no auto-create trigger)
    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        pin: applicationData.pin,
        security_question: applicationData.securityQuestion,
        security_answer: applicationData.securityAnswer,
        full_name: applicationData.fullName,
        email: applicationData.email,
        qr_verified: false,
        can_transact: false,
        email_verified: false,
      });

    if (profileInsertError) {
      console.error("❌ Error creating profile:", profileInsertError);
      // If profile already exists, try to update it instead
      if (profileInsertError.code === '23505') { // Unique violation
        console.log('Profile exists, updating instead...');
        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({
            pin: applicationData.pin,
            security_question: applicationData.securityQuestion,
            security_answer: applicationData.securityAnswer,
            full_name: applicationData.fullName,
            email: applicationData.email,
          })
          .eq("id", userId);
        
        if (profileUpdateError) {
          console.error("❌ Error updating profile:", profileUpdateError);
          throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
        }
      } else {
        throw new Error(`Failed to create profile: ${profileInsertError.message}`);
      }
    }

    console.log('✅ Profile created successfully');

    // Insert application into database (using service role, bypasses RLS)
    console.log('📝 Creating account application...');
    const { error: appError } = await supabaseAdmin
      .from("account_applications")
      .insert({
        user_id: userId,
        full_name: applicationData.fullName,
        date_of_birth: applicationData.dateOfBirth,
        email: applicationData.email,
        phone: applicationData.phoneNumber,
        phone_number: applicationData.phoneNumber,
        address: applicationData.residentialAddress,
        residential_address: applicationData.residentialAddress,
        account_type: applicationData.accountType,
        ssn: applicationData.ssn,
        security_question: applicationData.securityQuestion,
        security_answer: applicationData.securityAnswer,
        status: 'pending',
        qr_code_secret: qrSecret,
        // Document URLs
        id_front_url: applicationData.idFrontUrl,
        id_back_url: applicationData.idBackUrl,
        selfie_url: applicationData.selfieUrl,
        drivers_license_url: applicationData.driversLicenseUrl,
        address_proof_url: applicationData.addressProofUrl,
      });

    if (appError) {
      console.error("❌ Error submitting application:", appError);
      throw new Error(`Failed to create application: ${appError.message}`);
    }

    console.log('✅ Application created successfully');

    // Generate email verification token using Supabase
    console.log('📧 Generating email verification token...');
    const { data: verificationData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: applicationData.email,
      password: applicationData.password,
    });

    if (tokenError || !verificationData) {
      console.error("❌ Failed to generate verification token:", tokenError);
      throw new Error("Failed to generate verification link");
    }

    console.log('✅ Verification token generated successfully');

    // Extract the token from the hashed_token
    const verificationToken = verificationData.properties?.hashed_token || userId;
    
    // Get the request origin for redirect URL
    const origin = req.headers.get('origin') || 'https://vaultbankonline.com';
    const redirectUrl = `${origin}/verify-qr`;
    
    console.log('🔗 Using redirect URL:', redirectUrl);

    // Send verification email using SendGrid
    console.log('📧 Sending verification email...');
    const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke("send-verification-email", {
      body: {
        email: applicationData.email,
        fullName: applicationData.fullName,
        verificationToken: verificationToken,
        qrSecret: qrSecret,
        redirectUrl: redirectUrl,
      },
    });

    if (emailError) {
      console.error("❌ Error calling email function:", emailError);
      // Don't throw, account is created
    } else {
      console.log('✅ Email function called successfully');
      console.log('📧 Email response:', emailData);
    }

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
