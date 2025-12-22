-- Create compliance_cases table for estate/inheritance cases
CREATE TABLE public.compliance_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Estate / Inheritance',
  status TEXT NOT NULL DEFAULT 'pending',
  kyc_verification TEXT DEFAULT 'pending',
  account_documentation TEXT DEFAULT 'pending',
  beneficiary_confirmation TEXT DEFAULT 'pending',
  aml_screening TEXT DEFAULT 'pending',
  reviewer_name TEXT,
  reviewer_title TEXT,
  employee_id TEXT,
  reviewer_ip TEXT,
  review_timestamp TIMESTAMP WITH TIME ZONE,
  system_name TEXT DEFAULT 'VaultCore™ Compliance Platform',
  compliance_log_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_cases ENABLE ROW LEVEL SECURITY;

-- Users can view their own cases
CREATE POLICY "Users view own compliance cases"
ON public.compliance_cases
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all cases
CREATE POLICY "Admins manage compliance cases"
ON public.compliance_cases
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));