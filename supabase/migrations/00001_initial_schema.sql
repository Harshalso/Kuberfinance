-- Supabase Database Schema for Loan & Finance Utility Portal

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 2. Create global timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 4. Helper Function: is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Banks
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE INDEX idx_banks_status ON public.banks(status);

-- 6. Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE INDEX idx_companies_normalized_name ON public.companies(normalized_name);

-- 7. Company Categories
CREATE TABLE public.company_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES public.banks(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  eligibility_status TEXT,
  remarks TEXT,
  policy_version TEXT,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(bank_id, company_id)
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.company_categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE INDEX idx_company_categories_bank_id ON public.company_categories(bank_id);
CREATE INDEX idx_company_categories_company_id ON public.company_categories(company_id);

-- 8. Bank Policies
CREATE TABLE public.bank_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES public.banks(id) ON DELETE CASCADE NOT NULL,
  policy_title TEXT NOT NULL,
  policy_content TEXT,
  eligibility JSONB,
  loan_parameters JSONB,
  part_payment_rules JSONB,
  foreclosure_rules JSONB,
  documentation_requirements JSONB,
  effective_date DATE,
  version TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.bank_policies FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE INDEX idx_bank_policies_bank_id ON public.bank_policies(bank_id);

-- 9. Policy Documents
CREATE TABLE public.policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.bank_policies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents(policy_id);

-- 10. Offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  offer_type TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 11. Saved Calculations
CREATE TABLE public.saved_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calculation_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_saved_calculations_user_id ON public.saved_calculations(user_id);

-- 12. Payment Plans
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  razorpay_plan_id TEXT UNIQUE NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  duration TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- 13. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_subscription_id TEXT UNIQUE NOT NULL,
  plan_id UUID REFERENCES public.payment_plans(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 14. Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- 15. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 16. RLS POLICIES

-- Profiles: Users can read/update own profile. Admins can read/update all.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Public/Authenticated Read Data (Banks, Companies, Categories, Policies, Offers, Plans)
-- Note: Assuming users must be logged in to view sensitive utility data
CREATE POLICY "Authenticated users can view banks" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view company categories" ON public.company_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view bank policies" ON public.bank_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view policy documents" ON public.policy_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view offers" ON public.offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view payment plans" ON public.payment_plans FOR SELECT TO authenticated USING (true);

-- Admin Modifiable Data (Banks, Companies, Categories, Policies, Offers, Plans)
CREATE POLICY "Admins can manage banks" ON public.banks USING (is_admin());
CREATE POLICY "Admins can manage companies" ON public.companies USING (is_admin());
CREATE POLICY "Admins can manage company categories" ON public.company_categories USING (is_admin());
CREATE POLICY "Admins can manage bank policies" ON public.bank_policies USING (is_admin());
CREATE POLICY "Admins can manage policy documents" ON public.policy_documents USING (is_admin());
CREATE POLICY "Admins can manage offers" ON public.offers USING (is_admin());
CREATE POLICY "Admins can manage payment plans" ON public.payment_plans USING (is_admin());

-- Saved Calculations: Users can only see and manage their own
CREATE POLICY "Users can manage own saved calculations" ON public.saved_calculations
  USING (auth.uid() = user_id);

-- Subscriptions: Users can read their own. Modifying happens server-side via service_role.
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Audit Logs: Only admins can view. Writing happens server-side.
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin());
