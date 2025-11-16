-- Allow users to update their own account balances
CREATE POLICY "Users can update own account balances"
ON public.accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);