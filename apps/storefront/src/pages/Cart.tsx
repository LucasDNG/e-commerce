import { Link } from 'react-router-dom';
import { media } from '../api';
import { useCart } from '../cart';
import { formatMoney } from '../format';
import { useShop } from '../shop';

export function CartPage() {
  const { items, setQuantity, remove, totalCents } = useCart();
  const { catalog } = useShop();
  const currency = catalog?.shop.currency ?? 'ARS';

  if (items.length === 0) {
    return (
      <div className="narrow">
        <h1>El carrito está vacío</h1>
        <Link to="/" className="btn">
          Ver la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="split">
      <div>
        <h1>Carrito</h1>
        <ul className="lines">
          {items.map((item) => (
            <li key={item.productId}>
              {item.imageUrl ? <img src={media(item.imageUrl) ?? ''} alt="" /> : <div className="ph" />}
              <div>
                <Link to={`/producto/${item.slug}`}>{item.name}</Link>
                <p>{formatMoney(item.priceCents, currency)}</p>
                <div className="qty">
                  <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Menos">
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Más"
                  >
                    +
                  </button>
                </div>
              </div>
              <button type="button" className="text-btn" onClick={() => remove(item.productId)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="summary">
        <p>Total</p>
        <strong>{formatMoney(totalCents, currency)}</strong>
        <Link to="/pagar" className="btn">
          Continuar al pago
        </Link>
      </aside>
    </div>
  );
}
