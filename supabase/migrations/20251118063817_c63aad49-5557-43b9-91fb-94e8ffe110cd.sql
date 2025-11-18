-- Add notification sound preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sound_inheritance VARCHAR(50) DEFAULT 'inheritance-alert-1',
ADD COLUMN IF NOT EXISTS sound_transaction VARCHAR(50) DEFAULT 'transaction-alert-1',
ADD COLUMN IF NOT EXISTS sound_security VARCHAR(50) DEFAULT 'security-alert-1',
ADD COLUMN IF NOT EXISTS sound_general VARCHAR(50) DEFAULT 'general-alert-1';