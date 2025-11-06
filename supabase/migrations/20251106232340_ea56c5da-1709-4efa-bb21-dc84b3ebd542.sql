-- Add RLS policies for otp_codes table

-- Enable RLS if not already enabled
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTP codes (needed during login when user is not authenticated)
CREATE POLICY "Allow insert OTP codes"
ON public.otp_codes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to select their own OTP codes
CREATE POLICY "Users can view their own OTP codes"
ON public.otp_codes
FOR SELECT
TO anon, authenticated
USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Allow users to delete their own OTP codes
CREATE POLICY "Users can delete their own OTP codes"
ON public.otp_codes
FOR DELETE
TO anon, authenticated
USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);