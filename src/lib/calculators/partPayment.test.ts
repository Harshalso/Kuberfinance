import { describe, it, expect } from 'vitest';
import { calculatePartPayment } from './partPayment';

describe('calculatePartPayment', () => {
  it('should throw an error for invalid negative payments', () => {
    expect(() => calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 8.5, remainingTenure: 12, partPayment: -1000 })).toThrow();
  });

  it('should throw an error for invalid outstanding principal', () => {
    expect(() => calculatePartPayment({ outstandingPrincipal: 0, interestRate: 8.5, remainingTenure: 12, partPayment: 1000 })).toThrow();
  });

  it('should throw an error if part payment exceeds outstanding principal', () => {
    expect(() => calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 8.5, remainingTenure: 12, partPayment: 200000 })).toThrow();
  });

  it('should handle zero part payment correctly', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 0 });
    
    expect(result.original.emi).toBeCloseTo(8791.59, 1);
    expect(result.reduceTenure.newEmi).toBe(result.original.emi);
    expect(result.reduceTenure.newTenure).toBe(12);
    expect(result.reduceTenure.tenureSaved).toBe(0);
    expect(result.reduceTenure.interestSaved).toBe(0);
  });

  it('should handle partial payment correctly (reduce tenure)', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 10000 });
    
    expect(result.original.emi).toBeCloseTo(8791.59, 1);
    expect(result.reduceTenure.newEmi).toBeCloseTo(8791.59, 1);
    expect(result.reduceTenure.newTenure).toBeLessThan(12);
    expect(result.reduceTenure.tenureSaved).toBeGreaterThan(0);
    expect(result.reduceTenure.interestSaved).toBeGreaterThan(0);
  });

  it('should handle partial payment correctly (reduce EMI)', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 10000 });
    
    expect(result.reduceEmi.newEmi).toBeCloseTo(7912.43, 1);
    expect(result.reduceEmi.emiReduction).toBeCloseTo(879.16, 1);
    expect(result.reduceEmi.interestSaved).toBeGreaterThan(0);
  });

  it('should handle large payment correctly', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 500000, interestRate: 10, remainingTenure: 60, partPayment: 450000 });
    
    // Remaining principal is 50,000. Tenure will drastically reduce.
    expect(result.reduceTenure.newTenure).toBeLessThan(10);
    expect(result.reduceEmi.newEmi).toBeLessThan(result.original.emi);
  });

  it('should handle full payment correctly', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 100000 });
    
    expect(result.reduceTenure.newTenure).toBe(0);
    expect(result.reduceTenure.tenureSaved).toBe(12);
    expect(result.reduceTenure.interestSaved).toBeCloseTo(5499.06, 1);
    
    expect(result.reduceEmi.newEmi).toBe(0);
    expect(result.reduceEmi.emiReduction).toBeCloseTo(8791.59, 1);
  });
});
