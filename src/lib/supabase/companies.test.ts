import { describe, it, expect } from 'vitest';
import { normalizeCompanyName, normalizeBankKey, buildBankMap, DEFAULT_BANKS } from './companies';

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

describe('Bank Normalization & Alias Mapping', () => {
  it('should contain all required Banks and NBFCs in DEFAULT_BANKS', () => {
    const codes = DEFAULT_BANKS.map(b => b.code);
    const requiredBanks = ['HDFC', 'KOTAK', 'YES', 'INDUSIND', 'IDFC', 'BANDHAN', 'AXIS', 'SOUTH_INDIAN', 'ICICI'];
    const requiredNBFCs = ['TATA', 'BAJAJ', 'POONAWALA', 'SMFG', 'FIBE', 'INCRED', 'FINNABLE', 'SHRIRAM', 'LT_FINANCE', 'PIRAMAL', 'CHOLAMANDAL'];

    requiredBanks.forEach(code => {
      expect(codes).toContain(code);
    });

    requiredNBFCs.forEach(code => {
      expect(codes).toContain(code);
    });
  });

  it('should normalize bank names correctly', () => {
    expect(normalizeBankKey('HDFC Bank Ltd')).toBe('hdfc');
    expect(normalizeBankKey('Kotak Mahindra Bank Limited')).toBe('kotakmahindra');
    expect(normalizeBankKey('L&T Finance')).toBe('lt');
    expect(normalizeBankKey('Shriram Finance')).toBe('shriram');
    expect(normalizeBankKey('SMFG India Credit')).toBe('smfgindia');
  });

  it('should build bank map with alias support', () => {
    const mockBanksFromDb = [
      { id: 'bank-1', name: 'HDFC Bank', code: 'HDFC' },
      { id: 'bank-2', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
      { id: 'bank-3', name: 'L&T Finance', code: 'LT_FINANCE' },
      { id: 'nbfc-4', name: 'SMFG India Credit', code: 'SMFG' }
    ];

    const bankMap = buildBankMap(mockBanksFromDb);

    // Standard lookups
    expect(bankMap['hdfc bank']).toBe('bank-1');
    expect(bankMap['hdfc']).toBe('bank-1');
    expect(bankMap['kotak']).toBe('bank-2');

    // Alias lookups
    expect(bankMap['l&t']).toBe('bank-3');
    expect(bankMap['lt']).toBe('bank-3');
    expect(bankMap['smfg']).toBe('nbfc-4');
    expect(bankMap['fullerton']).toBe('nbfc-4');
  });
});

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
    expect(normalizeCompanyName(categories[0].company)).toBe(normalizeCompanyName(categories[1].company));
    expect(categories[0].bank).not.toBe(categories[1].bank);
  });
});

