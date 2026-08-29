-- Create Payment Plans Table
CREATE TABLE IF NOT EXISTS payment_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  features jsonb NOT NULL DEFAULT '[]',
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  plan_id text REFERENCES payment_plans(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id text REFERENCES payment_plans(id) NOT NULL,
  order_id text UNIQUE NOT NULL,
  payment_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert Demo Plans
INSERT INTO payment_plans (id, name, description, price, billing_cycle, features, is_popular) VALUES
('plan_basic', 'Basic', 'Essential features for individuals.', 999, 'monthly', '["Access to basic tools", "Community support", "Standard limits"]', false),
('plan_pro', 'Pro', 'Advanced features for professionals.', 2499, 'monthly', '["All Basic features", "Priority support", "Extended limits", "Advanced analytics"]', true),
('plan_enterprise', 'Enterprise', 'Full access for teams.', 9999, 'yearly', '["All Pro features", "24/7 dedicated support", "Unlimited usage", "Custom integrations"]', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Payment plans are viewable by everyone" ON payment_plans FOR SELECT USING (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON payment_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Service role bypasses all RLS automatically
