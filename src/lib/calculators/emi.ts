export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

export interface EMICalculationResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  schedule: AmortizationRow[];
}

export function calculateEMIDetails(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): EMICalculationResult {
  if (principal <= 0 || annualInterestRate <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalPayment: 0, principal: 0, schedule: [] };
  }

  const monthlyInterestRate = annualInterestRate / 12 / 100;
  
  // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const mathPow = Math.pow(1 + monthlyInterestRate, tenureMonths);
  const emi = (principal * monthlyInterestRate * mathPow) / (mathPow - 1);
  
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = balance * monthlyInterestRate;
    let principalComponent = emi - interest;
    
    // Adjust the final payment for rounding inconsistencies
    if (i === tenureMonths || balance < principalComponent) {
      principalComponent = balance;
    }

    const closingBalance = Math.max(0, balance - principalComponent);

    schedule.push({
      month: i,
      openingBalance: balance,
      emi: principalComponent + interest,
      principal: principalComponent,
      interest: interest,
      closingBalance: closingBalance,
    });

    totalInterest += interest;
    balance = closingBalance;
  }

  return {
    emi,
    totalInterest,
    totalPayment: principal + totalInterest,
    principal,
    schedule,
  };
}
