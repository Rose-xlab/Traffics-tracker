'use client';

import { useState, useCallback } from 'react';

interface TariffCalculatorResult {
  totalDuty: number;
  breakdown: {
    type: string;
    amount: number;
  }[];
}

export function useTariffCalculator(baseRate: number, additionalRates: number[]) {
  const [customValue, setCustomValue] = useState<number>(0);

  const calculate = useCallback((): TariffCalculatorResult => {
    const baseDuty = (customValue * baseRate) / 100;
    
    const additionalDuties = additionalRates.map((rate) => ({
      type: `Additional Duty ${rate}%`,
      amount: (customValue * rate) / 100,
    }));

    const totalDuty = baseDuty + additionalDuties.reduce((sum, duty) => sum + duty.amount, 0);

    return {
      totalDuty,
      breakdown: [
        { type: 'Base Duty', amount: baseDuty },
        ...additionalDuties,
      ],
    };
  }, [customValue, baseRate, additionalRates]);

  return {
    customValue,
    setCustomValue,
    calculate,
  };
}