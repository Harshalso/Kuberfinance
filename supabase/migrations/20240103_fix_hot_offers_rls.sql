-- Fix hot_offers RLS to use is_admin() instead of auth.users
DROP POLICY IF EXISTS "Admins can manage offers" ON hot_offers;

CREATE POLICY "Admins can manage offers" ON hot_offers FOR ALL 
USING (is_admin());
