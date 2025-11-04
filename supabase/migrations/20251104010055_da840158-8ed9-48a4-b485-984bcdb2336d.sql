-- Create account_requests table to track pending account requests
CREATE TABLE IF NOT EXISTS public.account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own requests"
  ON public.account_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
  ON public.account_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.account_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests"
  ON public.account_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying of pending requests
CREATE INDEX idx_account_requests_pending ON public.account_requests(status, created_at) WHERE status = 'pending';