-- Create support agents table
CREATE TABLE public.support_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add agent assignment and typing indicators to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN assigned_agent_id UUID REFERENCES public.support_agents(id),
ADD COLUMN user_typing BOOLEAN DEFAULT false,
ADD COLUMN agent_typing BOOLEAN DEFAULT false,
ADD COLUMN user_typing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN agent_typing_at TIMESTAMP WITH TIME ZONE;

-- Add agent reference to support_ratings
ALTER TABLE public.support_ratings
ADD COLUMN agent_id UUID REFERENCES public.support_agents(id);

-- Enable RLS on support_agents
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;

-- Policies for support_agents
CREATE POLICY "Anyone can view available agents"
ON public.support_agents FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage agents"
ON public.support_agents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert 10 default support agents
INSERT INTO public.support_agents (name, email, is_available) VALUES
('Support - Josie', 'josie@support.vaultbank.com', true),
('Support - Michael', 'michael@support.vaultbank.com', true),
('Support - Sarah', 'sarah@support.vaultbank.com', true),
('Support - David', 'david@support.vaultbank.com', true),
('Support - Emma', 'emma@support.vaultbank.com', true),
('Support - James', 'james@support.vaultbank.com', true),
('Support - Olivia', 'olivia@support.vaultbank.com', true),
('Support - Daniel', 'daniel@support.vaultbank.com', true),
('Support - Sophia', 'sophia@support.vaultbank.com', true),
('Support - Ryan', 'ryan@support.vaultbank.com', true);

-- Create function to clear old typing indicators
CREATE OR REPLACE FUNCTION clear_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.support_tickets
  SET 
    user_typing = false,
    agent_typing = false
  WHERE 
    (user_typing_at < NOW() - INTERVAL '5 seconds' AND user_typing = true) OR
    (agent_typing_at < NOW() - INTERVAL '5 seconds' AND agent_typing = true);
END;
$$;