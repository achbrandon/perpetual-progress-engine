-- Update joint_account_requests default deposit percentage to 100%
ALTER TABLE public.joint_account_requests 
ALTER COLUMN required_deposit_percentage SET DEFAULT 1.0;

-- Update existing records to reflect 100% deposit requirement
UPDATE public.joint_account_requests 
SET required_deposit_percentage = 1.0 
WHERE required_deposit_percentage != 1.0;