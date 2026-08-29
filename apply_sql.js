import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
// Actually, I can construct the DB URL from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY? No.
// Supabase connection string is typically postgresql://postgres.[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:6543/postgres
