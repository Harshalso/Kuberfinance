-- Create subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  billing_interval text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  max_users integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop dependent tables so we can recreate them perfectly
DROP TABLE IF EXISTS subscription_members;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS subscriptions;

-- Create subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  razorpay_order_id text,
  status text NOT NULL CHECK (status IN ('active', 'pending', 'authenticated', 'paused', 'cancelled', 'expired', 'failed', 'past_due')),
  billing_interval text,
  amount numeric,
  currency text DEFAULT 'INR',
  start_date timestamptz,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_members
CREATE TABLE subscription_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) NOT NULL,
  member_user_id uuid REFERENCES auth.users(id),
  member_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('invited', 'active', 'removed', 'expired')),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subscription_id, member_email)
);

-- Create payment_transactions
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_events
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'processed'
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Users view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own team" ON subscription_members FOR SELECT USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);
CREATE POLICY "Owners manage team" ON subscription_members FOR ALL USING (auth.uid() = owner_user_id);
