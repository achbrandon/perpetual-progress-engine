-- Create storage bucket for account documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'account-documents',
  'account-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
);

-- Create storage policies for account documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'account-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'account-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'account-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage all documents"
ON storage.objects FOR ALL
USING (bucket_id = 'account-documents');

-- Add document URLs to account_applications table
ALTER TABLE account_applications
ADD COLUMN IF NOT EXISTS id_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_back_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS drivers_license_url TEXT,
ADD COLUMN IF NOT EXISTS address_proof_url TEXT;