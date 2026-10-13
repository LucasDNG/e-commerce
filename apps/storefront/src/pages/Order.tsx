import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Order } from '../api';
import { formatMoney } from '../format';

const labels: Record<Order['status'], string> = {
  paid: 'Pago confirmado',
  pending_payment: 'El pago todavía no se acreditó',
  stock_failed: 'No alcanzaba el stock para completar el pedido',
};

export function OrderPage() {
  const { token = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Order>(`/api/orders/${token}`)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Pedido no encontrado');
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!order) return <p className="status-copy">Buscando el pedido…</p>;

  return (
    <div className="narrow receipt">
      <p className="kicker">Pedido {order.number}</p>
      <h1>{labels[order.status]}</h1>
      <p>
        {order.customerName}
        <br />
        {order.addressLine}, {order.city}
      </p>
      <ul className="receipt-lines">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatMoney(item.unitPriceCents * item.quantity, order.currency)}</span>
          </li>
        ))}
      </ul>
      <p className="receipt-total">
        <span>Total</span>
        <strong>{formatMoney(order.totalCents, order.currency)}</strong>
      </p>
      <Link to="/" className="btn">
        Seguir mirando
      </Link>
    </div>
  );
}
