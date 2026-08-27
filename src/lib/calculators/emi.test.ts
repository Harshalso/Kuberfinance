import { describe, it, expect } from 'vitest';
import { calculateEMIDetails } from './emi';

describe('calculateEMIDetails', () => {
  it('should return 0 for invalid inputs', () => {
    const result = calculateEMIDetails(0, 8.5, 12);
    expect(result.emi).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayment).toBe(0);
    expect(result.schedule).toEqual([]);
  });

  it('should correctly calculate EMI for a standard loan', () => {
    // 1 Lakh at 10% for 12 months
    const principal = 100000;
    const rate = 10;
    const tenure = 12;

    const result = calculateEMIDetails(principal, rate, tenure);

    // Expected EMI is approx 8791.59
    expect(result.emi).toBeCloseTo(8791.59, 1);
    
    // Expected total payment = emi * 12 = 105499
    expect(result.totalPayment).toBeCloseTo(105499.06, 1);
    
    // Expected total interest = total payment - principal = 5499
    expect(result.totalInterest).toBeCloseTo(5499.06, 1);

    expect(result.principal).toBe(principal);

    expect(result.schedule.length).toBe(12);

    // Month 1 checks
    const month1 = result.schedule[0];
    expect(month1.month).toBe(1);
    expect(month1.openingBalance).toBe(100000);
    expect(month1.interest).toBeCloseTo(833.33, 1); // 100000 * (10/1200)
    expect(month1.principal).toBeCloseTo(7958.26, 1); // EMI - Interest
    expect(month1.closingBalance).toBeCloseTo(92041.74, 1);

    // Final month checks
    const finalMonth = result.schedule[11];
    expect(finalMonth.month).toBe(12);
    expect(finalMonth.closingBalance).toBeCloseTo(0, 4); // Should zero out
  });
});
