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
    <p className="price">
      {onSale && <s>{formatMoney(compareAtCents, currency)}</s>}
      <strong>{formatMoney(cents, currency)}</strong>
    </p>
  );
}
