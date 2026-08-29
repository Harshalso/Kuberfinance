import { supabase } from './client';

export interface Bank {
  id: string;
  name: string;
  logo_url?: string;
  status: string;
}

export interface BankPolicy {
  id: string;
  bank_id: string;
  policy_title: string;
  policy_content: string;
  eligibility: any;
  loan_parameters: any;
  part_payment_rules: any;
  foreclosure_rules: any;
  documentation_requirements: any;
  version: string;
  effective_date: string;
  status: string;
  updated_at: string;
  bank?: Bank;
}

export async function getActiveBanksWithPolicies() {
  const { data, error } = await supabase
    .from('banks')
    .select(`
      id, 
      name, 
      logo_url, 
      status,
      bank_policies ( id )
    `)
    .eq('status', 'active')
    .eq('bank_policies.status', 'active')
    .order('name');
    
  if (error) throw error;
  
  // Filter banks that actually have active policies
  return data.filter(bank => bank.bank_policies && bank.bank_policies.length > 0);
}

export async function getBankPolicy(bankId: string): Promise<BankPolicy | null> {
  const { data, error } = await supabase
    .from('bank_policies')
    .select(`
      *,
      bank:banks(*)
    `)
    .eq('bank_id', bankId)
    .eq('status', 'active')
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data as BankPolicy;
}
