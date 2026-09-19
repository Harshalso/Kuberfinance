import { supabase } from './client';

export interface SearchFilters {
  bankId?: string;
  query?: string;
  page: number;
  limit: number;
}

export interface DefaultBankSeed {
  name: string;
  code: string;
  description?: string;
  aliases: string[];
}

export const DEFAULT_BANKS: DefaultBankSeed[] = [
  // Banks
  { name: 'HDFC Bank', code: 'HDFC', description: 'HDFC Bank Limited', aliases: ['hdfc', 'hdfc bank', 'hdfc bank ltd', 'hdfc bank limited'] },
  { name: 'Kotak Mahindra Bank', code: 'KOTAK', description: 'Kotak Mahindra Bank Limited', aliases: ['kotak', 'kotak bank', 'kotak mahindra', 'kotak mahindra bank'] },
  { name: 'Yes Bank', code: 'YES', description: 'YES Bank Limited', aliases: ['yes', 'yes bank', 'yes bank ltd'] },
  { name: 'IndusInd Bank', code: 'INDUSIND', description: 'IndusInd Bank Limited', aliases: ['indusind', 'indusind bank', 'indus ind'] },
  { name: 'IDFC First Bank', code: 'IDFC', description: 'IDFC FIRST Bank Limited', aliases: ['idfc', 'idfc bank', 'idfc first', 'idfc first bank'] },
  { name: 'Bandhan Bank', code: 'BANDHAN', description: 'Bandhan Bank Limited', aliases: ['bandhan', 'bandhan bank'] },
  { name: 'Axis Bank', code: 'AXIS', description: 'Axis Bank Limited', aliases: ['axis', 'axis bank', 'axis bank ltd'] },
  { name: 'South Indian Bank', code: 'SOUTH_INDIAN', description: 'South Indian Bank Limited', aliases: ['south indian', 'south indian bank', 'sib'] },
  { name: 'ICICI Bank', code: 'ICICI', description: 'ICICI Bank Limited', aliases: ['icici', 'icici bank', 'icici bank ltd'] },
  { name: 'State Bank of India', code: 'SBI', description: 'State Bank of India', aliases: ['sbi', 'state bank of india'] },

  // NBFCs
  { name: 'Tata Capital', code: 'TATA', description: 'Tata Capital Limited', aliases: ['tata', 'tata capital', 'tata capital financial services'] },
  { name: 'Bajaj Finance', code: 'BAJAJ', description: 'Bajaj Finance Limited', aliases: ['bajaj', 'bajaj finance', 'bajaj finserv', 'bajaj finance ltd'] },
  { name: 'Poonawalla Fincorp', code: 'POONAWALA', description: 'Poonawalla Fincorp Limited', aliases: ['poonawala', 'poonawalla', 'poonawalla fincorp'] },
  { name: 'SMFG India Credit', code: 'SMFG', description: 'SMFG India Credit Co. Ltd.', aliases: ['smfg', 'smfg india', 'smfg india credit', 'fullerton'] },
  { name: 'Fibe', code: 'FIBE', description: 'Fibe (formerly EarlySalary)', aliases: ['fibe', 'earlysalary', 'early salary'] },
  { name: 'InCred', code: 'INCRED', description: 'InCred Financial Services', aliases: ['incred', 'incred finance', 'incred financial services'] },
  { name: 'Finnable', code: 'FINNABLE', description: 'Finnable Credit Private Limited', aliases: ['finnable', 'finnable credit'] },
  { name: 'Shriram Finance', code: 'SHRIRAM', description: 'Shriram Finance Limited', aliases: ['shriram', 'shriram finance', 'shriram transport'] },
  { name: 'L&T Finance', code: 'LT_FINANCE', description: 'L&T Finance Limited', aliases: ['l&t', 'lt', 'l&t finance', 'lt finance', 'landt'] },
  { name: 'Piramal Finance', code: 'PIRAMAL', description: 'Piramal Capital & Housing Finance', aliases: ['piramal', 'piramal finance', 'piramal capital'] },
  { name: 'Cholamandalam', code: 'CHOLAMANDAL', description: 'Cholamandalam Investment and Finance Company', aliases: ['cholamandal', 'cholamandalam', 'chola', 'cholamandalam finance'] }
];

export function normalizeBankKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/private|pvt|limited|ltd|bank|finance|fincorp|credit|services|co/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function buildBankMap(banks: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  
  banks.forEach(b => {
    if (!b) return;
    const id = b.id;
    if (b.name) {
      map[b.name.toLowerCase()] = id;
      map[normalizeBankKey(b.name)] = id;
    }
    if (b.code) {
      map[b.code.toLowerCase()] = id;
      map[normalizeBankKey(b.code)] = id;
    }
    
    // Check match against DEFAULT_BANKS aliases
    DEFAULT_BANKS.forEach(def => {
      if (
        (b.code && b.code.toLowerCase() === def.code.toLowerCase()) ||
        (b.name && normalizeBankKey(b.name) === normalizeBankKey(def.name))
      ) {
        def.aliases.forEach(alias => {
          map[alias.toLowerCase()] = id;
          map[normalizeBankKey(alias)] = id;
        });
      }
    });
  });

  return map;
}

export async function seedDefaultBanks() {
  try {
    const { data: existing } = await supabase.from('banks').select('code, name');
    const existingCodes = new Set((existing || []).map(b => b.code.toLowerCase()));

    const missing = DEFAULT_BANKS.filter(b => !existingCodes.has(b.code.toLowerCase()));
    
    if (missing.length > 0) {
      const recordsToInsert = missing.map(b => ({
        name: b.name,
        code: b.code,
        description: b.description || b.name,
        status: 'active'
      }));

      await supabase.from('banks').insert(recordsToInsert);
    }
  } catch (err) {
    console.warn("Could not seed default banks:", err);
  }
}

export async function getBanks() {
  let { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('status', 'active')
    .order('name');
    
  if (error) throw error;

  // Auto seed missing default banks if any are missing
  if (!data || data.length < DEFAULT_BANKS.length) {
    await seedDefaultBanks();
    const res = await supabase
      .from('banks')
      .select('*')
      .eq('status', 'active')
      .order('name');
    if (res.data) data = res.data;
  }

  return data || [];
}

export async function autoCreateBank(bankName: string, bankMap: Record<string, string>): Promise<string | null> {
  const normKey = normalizeBankKey(bankName);
  if (!bankName || !normKey) return null;

  // Check if existing in map
  if (bankMap[bankName.toLowerCase()]) return bankMap[bankName.toLowerCase()];
  if (bankMap[normKey]) return bankMap[normKey];

  // Try creating in Supabase
  try {
    const code = normKey.toUpperCase().slice(0, 20) || 'BANK_' + Date.now();
    const { data, error } = await supabase
      .from('banks')
      .insert({
        name: bankName.trim(),
        code: code,
        description: `${bankName.trim()} (Auto-created)`,
        status: 'active'
      })
      .select('id, name, code')
      .single();

    if (data && data.id) {
      bankMap[bankName.toLowerCase()] = data.id;
      bankMap[normKey] = data.id;
      return data.id;
    }
  } catch (err) {
    console.error(`Failed to auto-create bank "${bankName}":`, err);
  }

  return null;
}

export async function searchCompanyCategories(filters: SearchFilters) {
  let query = supabase
    .from('company_categories')
    .select(`
      *,
      bank:banks!inner(*),
      company:companies!inner(*)
    `, { count: 'exact' });

  if (filters.bankId) {
    query = query.eq('bank_id', filters.bankId);
  }

  if (filters.query && filters.query.trim().length > 0) {
    const searchTerm = `%${filters.query.trim()}%`;
    query = query.ilike('company.company_name', searchTerm);
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count: count || 0 };
}

export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/private/g, 'pvt')
    .replace(/limited/g, 'ltd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export interface ParsedCategoryRow {
  bankName: string;
  companyName: string;
  category: string;
  subCategory?: string;
  eligibilityStatus?: string;
  remarks?: string;
  policyVersion?: string;
  effectiveDate?: string;
}

export async function executeImport(validRows: ParsedCategoryRow[], bankMap: Record<string, string>) {
  const summary = {
    totalProcessed: validRows.length,
    newCompanies: 0,
    errors: [] as string[]
  };

  if (validRows.length === 0) return summary;

  // Ensure missing banks are resolved or auto-created
  for (const row of validRows) {
    const normKey = normalizeBankKey(row.bankName);
    let bankId = bankMap[row.bankName.toLowerCase()] || bankMap[normKey];

    if (!bankId) {
      bankId = await autoCreateBank(row.bankName, bankMap) || '';
    }
  }

  // 1. Get unique normalized company names from validRows
  const uniqueNormalizedNames = Array.from(new Set(
    validRows.map(r => normalizeCompanyName(r.companyName))
  )).filter(Boolean);

  // 2. Fetch existing companies in chunks of 500 for high efficiency
  let existingCompanies: any[] = [];
  for (let i = 0; i < uniqueNormalizedNames.length; i += 500) {
    const chunk = uniqueNormalizedNames.slice(i, i + 500);
    const { data, error } = await supabase
      .from('companies')
      .select('id, normalized_name')
      .in('normalized_name', chunk);
      
    if (error) {
      summary.errors.push(`Error fetching existing companies: ${error.message}`);
      throw error;
    }
    if (data) existingCompanies = existingCompanies.concat(data);
  }

  const companyMap = new Map<string, string>();
  existingCompanies.forEach(c => companyMap.set(c.normalized_name, c.id));

  // 3. Find missing companies to insert (deduplicating in-memory)
  const companiesToInsert: { company_name: string; normalized_name: string }[] = [];
  const seenNewNames = new Set<string>();

  for (const row of validRows) {
    const norm = normalizeCompanyName(row.companyName);
    if (!norm) continue;
    if (!companyMap.has(norm) && !seenNewNames.has(norm)) {
      seenNewNames.add(norm);
      companiesToInsert.push({
        company_name: row.companyName.trim(),
        normalized_name: norm
      });
    }
  }

  // 4. Batch insert new unique companies
  if (companiesToInsert.length > 0) {
    for (let i = 0; i < companiesToInsert.length; i += 500) {
      const chunk = companiesToInsert.slice(i, i + 500);
      const { data, error } = await supabase
        .from('companies')
        .insert(chunk)
        .select('id, normalized_name');
        
      if (error) {
        summary.errors.push(`Error inserting companies: ${error.message}`);
        throw error;
      }
      if (data) {
        data.forEach(c => companyMap.set(c.normalized_name, c.id));
        summary.newCompanies += data.length;
      }
    }
  }

  // 5. Prepare categories for upsert
  const categoryMap = new Map<string, any>(); // key: `${bankId}_${companyId}`

  for (const row of validRows) {
    const normKey = normalizeBankKey(row.bankName);
    const bankId = bankMap[row.bankName.toLowerCase()] || bankMap[normKey];
    const companyId = companyMap.get(normalizeCompanyName(row.companyName));
    
    if (!bankId || !companyId) continue;

    let parsedDate = null;
    if (row.effectiveDate) {
      const d = new Date(row.effectiveDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d.toISOString().split('T')[0];
      }
    }

    const key = `${bankId}_${companyId}`;
    categoryMap.set(key, {
      bank_id: bankId,
      company_id: companyId,
      category: row.category,
      sub_category: row.subCategory || null,
      eligibility_status: row.eligibilityStatus || null,
      remarks: row.remarks || null,
      policy_version: row.policyVersion || null,
      effective_date: parsedDate
    });
  }

  const categoriesToUpsert = Array.from(categoryMap.values());

  // 6. Bulk Upsert Categories in chunks of 500
  for (let i = 0; i < categoriesToUpsert.length; i += 500) {
    const chunk = categoriesToUpsert.slice(i, i + 500);
    const { error } = await supabase
      .from('company_categories')
      .upsert(chunk, { onConflict: 'bank_id, company_id' });
      
    if (error) {
      summary.errors.push(`Error upserting categories: ${error.message}`);
      throw error;
    }
  }

  return summary;
}

