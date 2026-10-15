import { Link } from 'react-router-dom';
import { media } from '../api';
import { useCart } from '../cart';
import { formatMoney } from '../format';
import { useShop } from '../shop';
import { btn } from '../ui';

export function CartPage() {
  const { items, setQuantity, remove, totalCents } = useCart();
  const { catalog } = useShop();
  const currency = catalog?.shop.currency ?? 'ARS';

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 md:px-10">
        <h1 className="font-serif text-5xl tracking-tight">El carrito está vacío</h1>
        <Link to="/" className={`${btn} mt-8`}>
          Ver la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto my-4 grid w-full max-w-6xl gap-12 rounded-[2rem] bg-paper/94 px-6 py-12 backdrop-blur-md md:my-8 md:px-10 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <div>
        <h1 className="font-serif text-5xl tracking-tight md:text-6xl">Carrito</h1>
        <ul className="mt-10 grid gap-8">
          {items.map((item) => (
            <li key={item.productId} className="grid grid-cols-[88px_1fr] items-start gap-4 sm:grid-cols-[104px_1fr] sm:gap-5">
              {item.imageUrl ? (
                <img src={media(item.imageUrl) ?? ''} alt="" className="h-24 w-24 rounded-2xl bg-stage object-cover sm:h-28 sm:w-28" />
              ) : (
                <span className="block h-24 w-24 rounded-2xl bg-stage sm:h-28 sm:w-28" />
              )}
              <div>
                <Link to={`/producto/${item.slug}`} className="font-serif text-2xl text-ink no-underline">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{formatMoney(item.priceCents, currency)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-line bg-card">
                    <button type="button" className="grid h-10 w-10 place-items-center" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Menos">
                      −
                    </button>
                    <span className="grid h-10 w-6 place-items-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center disabled:opacity-35"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Más"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" className="text-sm text-muted underline underline-offset-4" onClick={() => remove(item.productId)}>
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-3xl bg-card p-8 shadow-sm lg:sticky lg:top-28">
        <p className="text-sm text-muted">Total</p>
        <strong className="mt-2 block font-serif text-5xl font-normal tracking-tight">{formatMoney(totalCents, currency)}</strong>
        <Link to="/pagar" className={`${btn} mt-8 w-full`}>
          Continuar al pago
        </Link>
      </aside>
    </div>
  );
}
