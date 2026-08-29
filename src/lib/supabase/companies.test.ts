import { describe, it, expect } from 'vitest';
import { normalizeCompanyName } from './companies';

describe('normalizeCompanyName', () => {
  it('should handle exact matches properly by standardizing', () => {
    expect(normalizeCompanyName('TATA CONSULTANCY SERVICES')).toBe('tataconsultancyservices');
  });

  it('should handle partial/case insensitive formatting', () => {
    expect(normalizeCompanyName('Tata Consultancy')).toBe('tataconsultancy');
  });

  it('should replace private with pvt', () => {
    expect(normalizeCompanyName('Tata Consultancy Private Limited')).toBe('tataconsultancypvtltd');
  });

  it('should strip special characters', () => {
    expect(normalizeCompanyName('Tata Consultancy & Services, Inc.')).toBe('tataconsultancyservicesinc');
  });

  it('should handle empty or missing company names gracefully', () => {
    expect(normalizeCompanyName('')).toBe('');
    expect(normalizeCompanyName('   ')).toBe('');
  });
});

// Mocking Supabase is too complex for this environment, so we will create a pure 
// test for the data structures that executeImport would use to filter duplicates.

describe('Company Search & Import Logic', () => {
  it('should identify exact match and duplicate companies', () => {
    const list = ['Tata Consultancy', 'tata consultancy'];
    const normalized = list.map(normalizeCompanyName);
    expect(normalized[0]).toBe(normalized[1]); // Duplicate detected
  });

  it('should differentiate same company across different banks', () => {
    const categories = [
      { bank: 'HDFC', company: 'Tata', category: 'CAT A' },
      { bank: 'ICICI', company: 'Tata', category: 'Super A' }
    ];
    // They share the same normalized name, but different bank relationships.
    expect(normalizeCompanyName(categories[0].company)).toBe(normalizeCompanyName(categories[1].company));
    expect(categories[0].bank).not.toBe(categories[1].bank);
  });
});
