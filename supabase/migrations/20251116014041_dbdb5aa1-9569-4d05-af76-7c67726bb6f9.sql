-- Create table for document tracking and shipments
CREATE TABLE IF NOT EXISTS public.joint_account_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  joint_request_id UUID NOT NULL REFERENCES public.joint_account_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'agreement_letter', 'credit_card', 'signed_agreement'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'signed', 'verified'
  sent_to_email TEXT,
  shipped_to_address TEXT,
  tracking_number TEXT,
  signed_document_url TEXT,
  signature_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.joint_account_documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all documents
CREATE POLICY "Admins manage documents"
  ON public.joint_account_documents
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view documents related to their joint account requests
CREATE POLICY "Users view own joint account documents"
  ON public.joint_account_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.joint_account_requests
      WHERE id = joint_account_documents.joint_request_id
      AND requester_user_id = auth.uid()
    )
  );

-- Users can update their signed document uploads
CREATE POLICY "Users upload signed documents"
  ON public.joint_account_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.joint_account_requests
      WHERE id = joint_account_documents.joint_request_id
      AND requester_user_id = auth.uid()
    )
    AND document_type = 'signed_agreement'
  );

-- Add tracking fields to joint account requests
ALTER TABLE public.joint_account_requests
ADD COLUMN IF NOT EXISTS agreement_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_joint_account_documents_request 
  ON public.joint_account_documents(joint_request_id);

CREATE INDEX IF NOT EXISTS idx_joint_account_documents_status 
  ON public.joint_account_documents(status);