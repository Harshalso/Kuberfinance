-- Migration: Update Banks & NBFCs and enforce company uniqueness
-- 1. Ensure UNIQUE constraint on companies(normalized_name) to prevent duplicate companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'companies_normalized_name_key'
    ) THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_normalized_name_key UNIQUE (normalized_name);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

-- Also add a unique index if constraint creation skipped
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_normalized_name_unique ON public.companies(normalized_name);

-- 2. Upsert target Banks and NBFCs into public.banks table
INSERT INTO public.banks (name, code, description, status) VALUES
  ('HDFC Bank', 'HDFC', 'HDFC Bank Limited', 'active'),
  ('Kotak Mahindra Bank', 'KOTAK', 'Kotak Mahindra Bank Limited', 'active'),
  ('Yes Bank', 'YES', 'YES Bank Limited', 'active'),
  ('IndusInd Bank', 'INDUSIND', 'IndusInd Bank Limited', 'active'),
  ('IDFC First Bank', 'IDFC', 'IDFC FIRST Bank Limited', 'active'),
  ('Bandhan Bank', 'BANDHAN', 'Bandhan Bank Limited', 'active'),
  ('Axis Bank', 'AXIS', 'Axis Bank Limited', 'active'),
  ('South Indian Bank', 'SOUTH_INDIAN', 'South Indian Bank Limited', 'active'),
  ('ICICI Bank', 'ICICI', 'ICICI Bank Limited', 'active'),
  ('State Bank of India', 'SBI', 'State Bank of India', 'active'),
  
  -- NBFCs
  ('Tata Capital', 'TATA', 'Tata Capital Limited', 'active'),
  ('Bajaj Finance', 'BAJAJ', 'Bajaj Finance Limited', 'active'),
  ('Poonawalla Fincorp', 'POONAWALA', 'Poonawalla Fincorp Limited', 'active'),
  ('SMFG India Credit', 'SMFG', 'SMFG India Credit Co. Ltd.', 'active'),
  ('Fibe', 'FIBE', 'Fibe (formerly EarlySalary)', 'active'),
  ('InCred', 'INCRED', 'InCred Financial Services', 'active'),
  ('Finnable', 'FINNABLE', 'Finnable Credit Private Limited', 'active'),
  ('Shriram Finance', 'SHRIRAM', 'Shriram Finance Limited', 'active'),
  ('L&T Finance', 'LT_FINANCE', 'L&T Finance Limited', 'active'),
  ('Piramal Finance', 'PIRAMAL', 'Piramal Capital & Housing Finance', 'active'),
  ('Cholamandalam', 'CHOLAMANDAL', 'Cholamandalam Investment and Finance Company', 'active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();
