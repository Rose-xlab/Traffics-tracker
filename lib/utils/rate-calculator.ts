interface AdditionalRate {
  type: string;
  rate: number;
}

interface CalculationResult {
  baseAmount: number;
  additionalAmounts: {
    type: string;
    amount: number;
  }[];
  totalAmount: number;
}

export function calculateDuty(
  customValue: number,
  baseRate: number,
  additionalRates: AdditionalRate[] = []
): CalculationResult {
  const baseAmount = (customValue * baseRate) / 100;
  
  const additionalAmounts = additionalRates.map(({ type, rate }) => ({
    type,
    amount: (customValue * rate) / 100,
  }));

  const totalAmount = baseAmount + additionalAmounts.reduce((sum, { amount }) => sum + amount, 0);

  return {
    baseAmount,
    additionalAmounts,
    totalAmount,
  };
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

export function parseRate(rateString: string): number {
  return parseFloat(rateString.replace('%', ''));
}