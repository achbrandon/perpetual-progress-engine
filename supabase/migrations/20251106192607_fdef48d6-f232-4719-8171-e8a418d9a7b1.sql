-- Add RLS policy to allow admins to view all accounts
CREATE POLICY "Admins can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));