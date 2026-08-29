-- Create Subscription Members table
CREATE TABLE IF NOT EXISTS subscription_members (
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

-- Create Payment Events table for webhooks
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'processed'
);

-- Enable RLS
ALTER TABLE subscription_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Members RLS policies
CREATE POLICY "Users can view their own team memberships" ON subscription_members FOR SELECT
USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

CREATE POLICY "Owners can manage their team" ON subscription_members FOR ALL
USING (auth.uid() = owner_user_id);
