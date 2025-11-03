-- Update account_applications RLS policy to allow inserts during signup
-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.account_applications;

-- Create new insert policy that allows inserts during signup process
-- This allows inserts when:
-- 1. User is authenticated and user_id matches (normal flow)
-- 2. User_id is provided and matches a user in auth.users (signup flow before email verification)
CREATE POLICY "Users can insert their own applications" 
ON public.account_applications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = user_id))
);