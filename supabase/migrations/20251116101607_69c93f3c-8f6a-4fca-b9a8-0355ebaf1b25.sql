-- Drop the restrictive policy we just added
DROP POLICY IF EXISTS "Users can update own account balances" ON public.accounts;

-- Create a PERMISSIVE policy instead (uses OR logic with other policies)
CREATE POLICY "Users can update own account balances"
ON public.accounts
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);