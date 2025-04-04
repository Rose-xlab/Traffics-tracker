import { useState } from 'react';
import { Calculator, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTariffCalculator } from '@/hooks/use-tariff-calculator';

interface TariffCalculatorProps {
  baseRate: number;
  additionalRates: number[];
}

export function TariffCalculator({ baseRate, additionalRates }: TariffCalculatorProps) {
  const { customValue, setCustomValue, calculate } = useTariffCalculator(baseRate, additionalRates);
  const result = calculate();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        Duty Calculator
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customValue">Custom Value (USD)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="customValue"
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Estimated Duty</Label>
          <div className="h-10 bg-muted flex items-center px-3 rounded-md">
            <span className="text-lg font-semibold">${result.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="font-medium">Breakdown:</h3>
        {result.breakdown.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.type}:</span>
            <span>${item.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}