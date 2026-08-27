import { describe, it, expect } from 'vitest';
import { calculatePartPayment } from './partPayment';

describe('calculatePartPayment', () => {
  it('should throw error for invalid inputs', () => {
    expect(() => calculatePartPayment({ outstandingPrincipal: 0, interestRate: 8.5, remainingTenure: 12, partPayment: 1000 })).toThrow();
    expect(() => calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 8.5, remainingTenure: 12, partPayment: 200000 })).toThrow();
  });

  it('should handle zero part payment', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 0 });
    expect(result.reduceTenure.tenureSaved).toBe(0);
    expect(result.reduceTenure.interestSaved).toBeCloseTo(0, 2);
    expect(result.reduceEmi.emiReduction).toBeCloseTo(0, 2);
    expect(result.reduceEmi.interestSaved).toBeCloseTo(0, 2);
  });

  it('should handle full part payment', () => {
    const result = calculatePartPayment({ outstandingPrincipal: 100000, interestRate: 10, remainingTenure: 12, partPayment: 100000 });
    expect(result.reduceTenure.newTenure).toBe(0);
    expect(result.reduceTenure.tenureSaved).toBe(12);
    expect(result.reduceTenure.interestSaved).toBeCloseTo(result.original.remainingInterest, 2);
    expect(result.reduceEmi.newEmi).toBe(0);
    expect(result.reduceEmi.emiReduction).toBeCloseTo(result.original.emi, 2);
    expect(result.reduceEmi.interestSaved).toBeCloseTo(result.original.remainingInterest, 2);
  });

  it('should correctly calculate partial payment', () => {
    // 5 Lakhs, 10% rate, 60 months remaining, 1 Lakh part payment
    const result = calculatePartPayment({ outstandingPrincipal: 500000, interestRate: 10, remainingTenure: 60, partPayment: 100000 });
    
    // Check Original
    expect(result.original.emi).toBeCloseTo(10623.52, 1);
    expect(result.original.remainingInterest).toBeCloseTo(137411.33, 1);

    // Check Reduce Tenure
    expect(result.reduceTenure.newTenure).toBe(46); // Should drop from 60 to roughly 46
    expect(result.reduceTenure.tenureSaved).toBe(14);
    expect(result.reduceTenure.interestSaved).toBeGreaterThan(50000); // Saves significant interest

    // Check Reduce EMI
    expect(result.reduceEmi.newEmi).toBeCloseTo(8498.82, 1);
    expect(result.reduceEmi.emiReduction).toBeCloseTo(2124.70, 1);
    expect(result.reduceEmi.interestSaved).toBeCloseTo(27482.27, 1); // Exact 20% of original interest since principal dropped by 20%
  });
});
