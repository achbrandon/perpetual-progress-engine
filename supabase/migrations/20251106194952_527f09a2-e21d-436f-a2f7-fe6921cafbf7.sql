-- Remove the user insert policy
DROP POLICY IF EXISTS "Users can insert own account details" ON public.account_details;

-- Create function to generate account details
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate account details
DROP TRIGGER IF EXISTS auto_generate_account_details ON public.accounts;
CREATE TRIGGER auto_generate_account_details
AFTER INSERT ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION generate_account_details();