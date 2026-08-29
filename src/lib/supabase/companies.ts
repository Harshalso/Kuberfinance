import { supabase } from './client';

export interface SearchFilters {
  bankId?: string;
  query?: string;
  page: number;
  limit: number;
}

export async function getBanks() {
  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('status', 'active')
    .order('name');
    
  if (error) throw error;
  return data;
}

export async function searchCompanyCategories(filters: SearchFilters) {
  // Using !inner ensures we only get categories where the company matches the filter
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

  // 1. Get unique normalized company names
  const uniqueNormalizedNames = Array.from(new Set(
    validRows.map(r => normalizeCompanyName(r.companyName))
  )).filter(Boolean);

  // 2. Fetch existing companies
  let existingCompanies: any[] = [];
  // Split into chunks of 100 for safety with Supabase in()
  for (let i = 0; i < uniqueNormalizedNames.length; i += 100) {
    const chunk = uniqueNormalizedNames.slice(i, i + 100);
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

  // 3. Find new companies to create
  const companiesToInsert = [];
  const seenNewNames = new Set<string>();

  for (const row of validRows) {
    const norm = normalizeCompanyName(row.companyName);
    if (!companyMap.has(norm) && !seenNewNames.has(norm)) {
      seenNewNames.add(norm);
      companiesToInsert.push({
        company_name: row.companyName,
        normalized_name: norm
      });
    }
  }

  // 4. Insert new companies
  if (companiesToInsert.length > 0) {
    for (let i = 0; i < companiesToInsert.length; i += 100) {
      const chunk = companiesToInsert.slice(i, i + 100);
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
  const categoriesToUpsert = validRows.map(row => {
    const bankId = bankMap[row.bankName.toLowerCase()];
    const companyId = companyMap.get(normalizeCompanyName(row.companyName));
    
    if (!bankId || !companyId) return null;

    let parsedDate = null;
    if (row.effectiveDate) {
      // Very basic date handling, assume YYYY-MM-DD or standard JS parseable
      const d = new Date(row.effectiveDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d.toISOString().split('T')[0];
      }
    }

    return {
      bank_id: bankId,
      company_id: companyId,
      category: row.category,
      sub_category: row.subCategory || null,
      eligibility_status: row.eligibilityStatus || null,
      remarks: row.remarks || null,
      policy_version: row.policyVersion || null,
      effective_date: parsedDate
    };
  }).filter(Boolean);

  // 6. Bulk Upsert Categories
  for (let i = 0; i < categoriesToUpsert.length; i += 100) {
    const chunk = categoriesToUpsert.slice(i, i + 100);
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
