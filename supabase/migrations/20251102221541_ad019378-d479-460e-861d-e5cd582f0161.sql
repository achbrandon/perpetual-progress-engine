-- Add security fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS security_question TEXT,
ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reset_token TEXT NOT NULL UNIQUE,
  security_question TEXT NOT NULL,
  security_answer TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for password reset requests
CREATE POLICY "Users can view their own reset requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY "Anyone can create reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their own reset requests"
  ON public.password_reset_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create admin actions log table
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions"
  ON public.admin_actions_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create admin actions"
  ON public.admin_actions_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));