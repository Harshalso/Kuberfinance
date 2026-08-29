-- Add a GIN index on company_name to improve search performance on the companies table
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin(company_name gin_trgm_ops);
