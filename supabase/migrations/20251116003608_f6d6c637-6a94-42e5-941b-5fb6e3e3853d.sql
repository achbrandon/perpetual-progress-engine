-- Create joint account requests table
CREATE TABLE public.joint_account_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  partner_full_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  partner_phone TEXT NOT NULL,
  partner_ssn TEXT NOT NULL,
  partner_address TEXT NOT NULL,
  partner_id_document_url TEXT,
  partner_drivers_license_url TEXT,
  deposit_amount NUMERIC NOT NULL,
  required_deposit_percentage NUMERIC NOT NULL DEFAULT 0.9,
  status TEXT NOT NULL DEFAULT 'pending',
  otp_verified BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.joint_account_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own joint account requests"
ON public.joint_account_requests
FOR SELECT
USING (auth.uid() = requester_user_id);

CREATE POLICY "Users create joint account requests"
ON public.joint_account_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_user_id AND
  EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id = account_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users update own pending requests"
ON public.joint_account_requests
FOR UPDATE
USING (auth.uid() = requester_user_id AND status = 'pending');

CREATE POLICY "Admins view all joint account requests"
ON public.joint_account_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update joint account requests"
ON public.joint_account_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_joint_account_requests_status ON public.joint_account_requests(status);
CREATE INDEX idx_joint_account_requests_account ON public.joint_account_requests(account_id);
CREATE INDEX idx_joint_account_requests_requester ON public.joint_account_requests(requester_user_id);

-- Enable realtime for admin notifications
ALTER TABLE public.joint_account_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.joint_account_requests;