-- Add network column to transactions table for crypto network tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS crypto_network TEXT;

COMMENT ON COLUMN public.transactions.crypto_network IS 'The blockchain network used for crypto transactions (e.g., TRC-20, ERC-20, BTC Mainnet)';