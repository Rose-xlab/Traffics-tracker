export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export function isDateInRange(date: string | Date, months: number): boolean {
  const now = new Date();
  const compareDate = new Date(date);
  const monthsDiff = (now.getFullYear() - compareDate.getFullYear()) * 12 +
    now.getMonth() - compareDate.getMonth();
  return monthsDiff <= months;
}