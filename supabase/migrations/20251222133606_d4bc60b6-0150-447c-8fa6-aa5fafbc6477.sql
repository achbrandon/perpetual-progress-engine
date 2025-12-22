-- Add stamp_duty_amount column to compliance_cases table
ALTER TABLE public.compliance_cases 
ADD COLUMN stamp_duty_amount numeric DEFAULT 0;

-- Add stamp_duty_status column to track if it's paid or pending
ALTER TABLE public.compliance_cases 
ADD COLUMN stamp_duty_status text DEFAULT 'pending';