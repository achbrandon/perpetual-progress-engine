-- Add crypto-specific fields to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS crypto_currency text,
ADD COLUMN IF NOT EXISTS wallet_address text,
ADD COLUMN IF NOT EXISTS proof_of_payment_url text,
ADD COLUMN IF NOT EXISTS reference_number text;