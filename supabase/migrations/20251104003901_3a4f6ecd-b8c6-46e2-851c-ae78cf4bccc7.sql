-- Create function to calculate available balance excluding pending transactions
CREATE OR REPLACE FUNCTION public.calculate_available_balance(account_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
  pending_debits NUMERIC;
  available NUMERIC;
BEGIN
  -- Get the current balance
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE id = account_id_param;
  
  -- Calculate total pending debits (withdrawals that haven't completed yet)
  SELECT COALESCE(SUM(amount), 0) INTO pending_debits
  FROM public.transactions
  WHERE account_id = account_id_param
    AND transaction_type = 'debit'
    AND status = 'pending';
  
  -- Available balance = current balance - pending debits
  available := current_balance - pending_debits;
  
  RETURN available;
END;
$$;

-- Create function to update account balance when transaction is completed/failed
CREATE OR REPLACE FUNCTION public.update_account_on_transaction_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  -- Only process when status changes to 'completed' or 'failed'
  IF (OLD.status = 'pending' AND NEW.status IN ('completed', 'failed')) THEN
    
    IF NEW.status = 'completed' THEN
      -- Get current balance
      SELECT balance INTO new_balance
      FROM public.accounts
      WHERE id = NEW.account_id;
      
      -- Update balance based on transaction type
      IF NEW.transaction_type = 'credit' OR NEW.transaction_type = 'deposit' THEN
        new_balance := new_balance + NEW.amount;
      ELSIF NEW.transaction_type = 'debit' OR NEW.transaction_type = 'withdrawal' THEN
        new_balance := new_balance - NEW.amount;
      END IF;
      
      -- Update account balance
      UPDATE public.accounts
      SET balance = new_balance,
          available_balance = public.calculate_available_balance(NEW.account_id),
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSE
      -- Transaction failed, just recalculate available balance
      UPDATE public.accounts
      SET available_balance = public.calculate_available_balance(NEW.account_id),
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for transaction status updates
DROP TRIGGER IF EXISTS transaction_status_update ON public.transactions;
CREATE TRIGGER transaction_status_update
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_on_transaction_status();

-- Update all accounts to have correct available balances
UPDATE public.accounts
SET available_balance = public.calculate_available_balance(id);