-- Add account_reference_number column to compliance_cases
ALTER TABLE public.compliance_cases 
ADD COLUMN account_reference_number TEXT;