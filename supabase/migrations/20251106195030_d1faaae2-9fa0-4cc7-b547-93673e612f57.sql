-- Fix the search_path security warning for generate_account_details function
CREATE OR REPLACE FUNCTION generate_account_details()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.account_details (
    account_id,
    user_id,
    routing_number,
    swift_code,
    bank_address,
    branch_code
  ) VALUES (
    NEW.id,
    NEW.user_id,
    LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
    'VLTBANKUS33',
    '806 E Exchange St, Brodhead, WI 53520-0108, US',
    SUBSTRING(LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'), 1, 4)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;