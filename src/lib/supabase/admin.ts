import { supabase } from './client';

export interface AdminStats {
  totalUsers: number;
  totalBanks: number;
  totalCompanies: number;
  totalCategories: number;
  activePolicies: number;
  activeOffers: number;
}

export async function getAdminDashboardStats(): Promise<AdminStats> {
  // Execute these in parallel for efficiency
  const [
    usersRes,
    banksRes,
    companiesRes,
    categoriesRes,
    policiesRes,
    offersRes
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('banks').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('company_categories').select('id', { count: 'exact', head: true }),
    supabase.from('bank_policies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active')
  ]);

  return {
    totalUsers: usersRes.count || 0,
    totalBanks: banksRes.count || 0,
    totalCompanies: companiesRes.count || 0,
    totalCategories: categoriesRes.count || 0,
    activePolicies: policiesRes.count || 0,
    activeOffers: offersRes.count || 0
  };
}

export async function logAdminAction(
  userId: string,
  action: string,
  entity: string,
  entityId: string | null,
  metadata: any = {}
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    metadata
  });
  
  if (error) {
    console.error("Failed to log admin action:", error);
  }
}
