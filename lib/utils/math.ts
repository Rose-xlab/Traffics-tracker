export function roundToDecimals(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToDecimals((value / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0 || values.length !== weights.length) return 0;
  
  const sum = values.reduce((acc, value, index) => acc + value * weights[index], 0);
  const weightSum = weights.reduce((acc, weight) => acc + weight, 0);
  
  return weightSum === 0 ? 0 : sum / weightSum;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}