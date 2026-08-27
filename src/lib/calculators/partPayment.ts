export interface PartPaymentInputs {
  outstandingPrincipal: number;
  interestRate: number;
  remainingTenure: number;
  partPayment: number;
}

export interface PartPaymentResult {
  original: {
    emi: number;
    remainingInterest: number;
  };
  reduceTenure: {
    newEmi: number;
    newTenure: number;
    tenureSaved: number;
    interestSaved: number;
    remainingInterest: number;
  };
  reduceEmi: {
    oldEmi: number;
    newEmi: number;
    emiReduction: number;
    interestSaved: number;
    remainingInterest: number;
  };
}

export function calculatePartPayment(inputs: PartPaymentInputs): PartPaymentResult {
  const { outstandingPrincipal, interestRate, remainingTenure, partPayment } = inputs;

  if (
    outstandingPrincipal <= 0 ||
    interestRate <= 0 ||
    remainingTenure <= 0 ||
    partPayment < 0
  ) {
    throw new Error("Invalid input values");
  }

  if (partPayment > outstandingPrincipal) {
    throw new Error("Part payment cannot exceed outstanding principal");
  }

  const r = interestRate / 12 / 100;
  const n = remainingTenure;

  // Calculate current EMI
  const mathPow = Math.pow(1 + r, n);
  const currentEmi = (outstandingPrincipal * r * mathPow) / (mathPow - 1);
  const originalRemainingInterest = (currentEmi * n) - outstandingPrincipal;

  const newPrincipal = outstandingPrincipal - partPayment;

  // Strategy 1: Reduce Tenure
  let newTenure = 0;
  let reduceTenureInterest = 0;
  let tempPrincipal = newPrincipal;

  if (newPrincipal <= 0) {
    newTenure = 0;
    reduceTenureInterest = 0;
  } else if (partPayment === 0) {
    newTenure = remainingTenure;
    reduceTenureInterest = originalRemainingInterest;
  } else {
    // Determine new tenure by amortizing with current EMI
    while (tempPrincipal > 0.01 && newTenure < 1200) {
      const interest = tempPrincipal * r;
      let principalPaid = currentEmi - interest;
      
      if (principalPaid >= tempPrincipal) {
        principalPaid = tempPrincipal;
        reduceTenureInterest += interest;
        tempPrincipal = 0;
        newTenure++;
      } else {
        tempPrincipal -= principalPaid;
        reduceTenureInterest += interest;
        newTenure++;
      }
    }
  }

  // Strategy 2: Reduce EMI
  let newEmi = 0;
  let reduceEmiInterest = 0;
  
  if (newPrincipal > 0) {
    newEmi = (newPrincipal * r * mathPow) / (mathPow - 1);
    reduceEmiInterest = (newEmi * n) - newPrincipal;
  }

  return {
    original: {
      emi: currentEmi,
      remainingInterest: originalRemainingInterest,
    },
    reduceTenure: {
      newEmi: currentEmi,
      newTenure: newTenure,
      tenureSaved: remainingTenure - newTenure,
      remainingInterest: reduceTenureInterest,
      interestSaved: Math.max(0, originalRemainingInterest - reduceTenureInterest),
    },
    reduceEmi: {
      oldEmi: currentEmi,
      newEmi: newEmi,
      emiReduction: currentEmi - newEmi,
      remainingInterest: reduceEmiInterest,
      interestSaved: Math.max(0, originalRemainingInterest - reduceEmiInterest),
    }
  };
}
