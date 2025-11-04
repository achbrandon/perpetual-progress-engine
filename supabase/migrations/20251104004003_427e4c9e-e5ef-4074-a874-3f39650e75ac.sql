-- Create trigger to update available balance when new pending transaction is inserted
CREATE OR REPLACE FUNCTION public.update_available_balance_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update available balance for the account when a new pending transaction is created
  IF NEW.status = 'pending' AND NEW.transaction_type = 'debit' THEN
    UPDATE public.accounts
    SET available_balance = public.calculate_available_balance(NEW.account_id),
        updated_at = now()
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for transaction inserts
DROP TRIGGER IF EXISTS transaction_insert_update_balance ON public.transactions;
CREATE TRIGGER transaction_insert_update_balance
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_available_balance_on_insert();