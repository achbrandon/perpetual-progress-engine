-- Allow admins to create and manage transactions
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage accounts (update balances)
CREATE POLICY "Admins can update accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add column to track if transaction should auto-complete
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS auto_complete_at timestamp with time zone DEFAULT NULL;

-- Create function to auto-complete transactions
CREATE OR REPLACE FUNCTION auto_complete_pending_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.transactions
  SET status = 'completed'
  WHERE status = 'pending'
    AND auto_complete_at IS NOT NULL
    AND auto_complete_at <= NOW();
END;
$$;