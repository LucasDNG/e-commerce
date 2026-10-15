import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Order } from '../api';
import { formatMoney } from '../format';
import { btn, glass } from '../ui';

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

  if (error) return <p className={`${glass} mx-3 my-4 rounded-[2rem] px-6 py-24 text-danger md:mx-6`}>{error}</p>;
  if (!order) return <p className={`${glass} mx-3 my-4 rounded-[2rem] px-6 py-24 text-muted md:mx-6`}>Buscando el pedido…</p>;

  return (
    <div className={`${glass} mx-auto my-4 max-w-xl rounded-[2rem] px-6 py-14 md:my-8 md:py-20`}>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Pedido {order.number}</p>
      <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight">{labels[order.status]}</h1>
      <p className="mt-6 leading-relaxed text-muted">
        {order.customerName}
        <br />
        {order.addressLine}, {order.city}
      </p>
      <ul className="mt-10 grid gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatMoney(item.unitPriceCents * item.quantity, order.currency)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex justify-between border-t border-ink pt-4 text-lg">
        <span>Total</span>
        <strong className="font-medium">{formatMoney(order.totalCents, order.currency)}</strong>
      </p>
      <Link to="/" className={`${btn} mt-10`}>
        Seguir mirando
      </Link>
    </div>
  );
}
