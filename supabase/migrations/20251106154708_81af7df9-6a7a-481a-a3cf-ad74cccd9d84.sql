-- Allow admins to insert accounts
CREATE POLICY "Admins can insert accounts"
ON public.accounts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));