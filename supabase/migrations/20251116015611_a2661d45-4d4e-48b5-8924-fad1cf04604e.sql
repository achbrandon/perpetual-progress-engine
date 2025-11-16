
-- Make the account-documents bucket public so documents can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'account-documents';

-- Create RLS policy to allow admins to access all documents
CREATE POLICY "Admins can view all account documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'account-documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Allow users to view their own uploaded documents
CREATE POLICY "Users can view their own account documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'account-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
