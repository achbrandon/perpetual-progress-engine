-- Add account_number field to external_payment_accounts
ALTER TABLE public.external_payment_accounts
ADD COLUMN account_number text;