export function formatMoney(cents: number, currency: string): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

export function centsToMajor(cents: number): string {
  const text = (cents / 100).toFixed(2);
  return text.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function majorToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
