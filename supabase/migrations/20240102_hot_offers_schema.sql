-- Create Hot Offers Table
CREATE TABLE IF NOT EXISTS hot_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  offer_type text NOT NULL,
  image text,
  priority integer NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  terms_apply boolean NOT NULL DEFAULT false,
  cta_text text,
  cta_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert Dummy Offers
INSERT INTO hot_offers (title, description, offer_type, image, priority, active, terms_apply, cta_text, cta_link) VALUES
('Summer Savings Festival', 'Get up to 50% off on processing fees for all new personal loans this summer.', 'Personal Loan', 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800&q=80', 10, true, true, 'Apply Now', '/offers'),
('Zero Balance Salary Account', 'Open a premium salary account today with absolutely zero minimum balance requirements.', 'Bank Account', 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80', 5, true, false, 'Open Account', '/offers'),
('Credit Card Upgrade', 'Upgrade to our Platinum tier credit card and get 10,000 bonus rewards points.', 'Credit Card', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', 8, true, true, 'Upgrade Now', '/offers')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE hot_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Active offers are viewable by everyone" ON hot_offers FOR SELECT 
USING (active = true);

-- Admin can manage offers
CREATE POLICY "Admins can manage offers" ON hot_offers FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
));
