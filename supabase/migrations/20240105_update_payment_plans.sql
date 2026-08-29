UPDATE payment_plans SET active = false WHERE id IN ('plan_basic', 'plan_pro', 'plan_enterprise');

INSERT INTO payment_plans (id, name, description, price, billing_cycle, features, is_popular, active) VALUES
('plan_basic_monthly', 'Basic', 'Essential features for individuals.', 149, 'monthly', '["User Registration & Login", "EMI Calculator", "Company Category Search", "Part Payment Calculator", "Personal Account (1 email)", "Access to Bank Policies", "Saved Calculations"]', false, true),
('plan_pro_monthly', 'Pro', 'Advanced features for professionals.', 999, 'monthly', '["Everything in Basic", "Up to 10 registered email accounts", "Designed for teams, loan offices and finance professionals", "Priority access to new features"]', true, true),
('plan_basic_yearly', 'Basic Annual', 'Annual savings for individuals.', 1499, 'yearly', '["User Registration & Login", "EMI Calculator", "Company Category Search", "Part Payment Calculator", "Personal Account (1 email)", "Access to Bank Policies", "Saved Calculations"]', false, true),
('plan_pro_yearly', 'Pro Annual', 'Annual savings for professionals.', 9999, 'yearly', '["Everything in Basic", "Up to 10 email accounts", "Team-oriented access", "Priority access to new features"]', true, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  billing_cycle = EXCLUDED.billing_cycle, 
  features = EXCLUDED.features, 
  is_popular = EXCLUDED.is_popular, 
  active = EXCLUDED.active;
