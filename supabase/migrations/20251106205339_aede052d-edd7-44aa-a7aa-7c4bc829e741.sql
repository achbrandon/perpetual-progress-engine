-- Add RLS policy for admins to view and manage account requests
CREATE POLICY "Admins view all account requests"
ON public.account_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage account requests"
ON public.account_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));