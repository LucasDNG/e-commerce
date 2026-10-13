import { useEffect, useState } from 'react';
import { api, type Order } from '../api';
import { formatMoney, formatWhen } from '../format';

const labels: Record<Order['status'], string> = {
  paid: 'Pagado',
  pending_payment: 'Pendiente de pago',
  stock_failed: 'Sin stock',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Order[]>('/api/admin/orders')
      .then(setOrders)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los pedidos'));
  }, []);

  return (
    <>
      <header className="top">
        <p className="eyebrow">Ventas</p>
        <h1>Pedidos</h1>
      </header>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && <p className="muted">Cuando alguien pague en la tienda, el pedido aparece acá.</p>}
      <ul className="list">
        {orders.map((order) => (
          <li key={order.id} className="card stack">
            <button type="button" className="order-head" onClick={() => setOpen((value) => (value === order.id ? null : order.id))}>
              <strong>#{order.number}</strong>
              <span className={order.status === 'paid' ? 'good' : 'muted'}>{labels[order.status]}</span>
            </button>
            <p>
              {order.customerName}
              <br />
              {formatWhen(order.createdAt)}
            </p>
            <p>{formatMoney(order.totalCents, order.currency)}</p>
            {open === order.id && (
              <div className="stack">
                <p className="muted">
                  {order.email}
                  {order.phone ? ` · ${order.phone}` : ''}
                  <br />
                  {order.addressLine}, {order.city}
                </p>
                <ul className="mini">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} × {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
