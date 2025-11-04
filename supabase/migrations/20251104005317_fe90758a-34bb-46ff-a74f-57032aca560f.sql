-- Add driver's license URL column to account applications
ALTER TABLE public.account_applications
ADD COLUMN IF NOT EXISTS drivers_license_url TEXT;