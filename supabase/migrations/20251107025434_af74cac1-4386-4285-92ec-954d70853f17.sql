-- Add missing columns to support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'inquiry',
ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Support Chat',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES auth.users(id);