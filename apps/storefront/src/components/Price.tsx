import { formatMoney } from '../format';

export function Price({
  cents,
  compareAtCents,
  currency,
}: {
  cents: number;
  compareAtCents: number | null;
  currency: string;
}) {
  const onSale = compareAtCents !== null && compareAtCents > cents;
  return (
    <p className="mt-1 flex items-baseline gap-2 text-sm text-ink">
      {onSale && <s className="text-muted">{formatMoney(compareAtCents, currency)}</s>}
      <strong className="font-medium">{formatMoney(cents, currency)}</strong>
    </p>
  );
}
