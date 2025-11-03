-- Fix the search_path for the clear_old_typing_indicators function
CREATE OR REPLACE FUNCTION clear_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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