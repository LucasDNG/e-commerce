import { FormEvent, lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type CheckoutResponse, type Order } from '../api';
import { useCart } from '../cart';
import { formatMoney } from '../format';
import { useShop } from '../shop';

const StripePayment = lazy(() => import('../components/StripePayment'));

type FormState = {
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  notes: string;
};

const empty: FormState = {
  customerName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  postalCode: '',
  notes: '',
};

export function CheckoutPage() {
  const { items, totalCents, clear } = useCart();
  const { catalog } = useShop();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [created, setCreated] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [done, setDone] = useState(false);
  const currency = created?.order.currency ?? catalog?.shop.currency ?? 'ARS';
  const signature = items.map((item) => `${item.productId}:${item.quantity}`).join('|');

  useEffect(() => {
    setCreated(null);
  }, [signature]);

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function createOrder(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api<CheckoutResponse>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      setCreated(response);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el pedido');
    } finally {
      setBusy(false);
    }
  }

  async function finish(path: string, body: unknown) {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api<{ order: Order }>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setDone(true);
      clear();
      navigate(`/pedido/${response.order.token}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo confirmar el pago');
      setBusy(false);
    }
  }

  if (!done && items.length === 0 && !created) {
    return (
      <div className="narrow">
        <h1>No hay nada para pagar</h1>
        <Link to="/" className="btn">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const demo = created?.payment.provider === 'demo';
  const stripe = created?.payment.provider === 'stripe' ? created.payment : null;

  return (
    <div className="split">
      <form onSubmit={createOrder} className="stack">
        <h1>Pago</h1>
        <p className="lede">Los datos y el cobro quedan en esta página.</p>
        <label>
          Nombre y apellido
          <input value={form.customerName} onChange={(event) => update('customerName', event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
        </label>
        <label>
          Teléfono
          <input value={form.phone} onChange={(event) => update('phone', event.target.value)} />
        </label>
        <label>
          Dirección
          <input value={form.addressLine} onChange={(event) => update('addressLine', event.target.value)} required />
        </label>
        <div className="pair">
          <label>
            Ciudad
            <input value={form.city} onChange={(event) => update('city', event.target.value)} required />
          </label>
          <label>
            Código postal
            <input value={form.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
          </label>
        </div>
        <label>
          Notas
          <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={3} />
        </label>
        {!created && (
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Preparando el pago…' : 'Continuar al pago'}
          </button>
        )}
      </form>

      <aside className="summary pay-panel">
        <p>Total a pagar</p>
        <strong>{formatMoney(created?.order.totalCents ?? totalCents, currency)}</strong>
        {created && created.order.totalCents !== totalCents && <p className="fine">El total se actualizó con los precios vigentes.</p>}
        {!created && catalog?.shop.paymentMode === 'demo' && (
          <p className="fine">Al confirmar se abre el formulario de la tarjeta, sin salir de la tienda.</p>
        )}
        {created && demo && (
          <form
            className="pay-form"
            onSubmit={(event) => {
              event.preventDefault();
              void finish(`/api/checkout/${created.order.token}/confirm`, { cardNumber, exp, cvc });
            }}
          >
            <p className="demo-note">
              Modo demostración: no se cobra dinero real. Para aprobar el pago usá 4242 4242 4242 4242, un vencimiento futuro y
              cualquier CVC de 3 dígitos.
            </p>
            <label>
              Número de tarjeta
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(event) =>
                  setCardNumber(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, '$1 '),
                  )
                }
                required
              />
            </label>
            <div className="pair">
              <label>
                Vencimiento
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={exp}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                    setExp(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                  }}
                  required
                />
              </label>
              <label>
                CVC
                <input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                />
              </label>
            </div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Cobrando…' : `Pagar ${formatMoney(created.order.totalCents, currency)}`}
            </button>
          </form>
        )}
        {created && stripe && (
          <Suspense fallback={<p className="fine">Cargando el pago…</p>}>
            <StripePayment
              publishableKey={stripe.publishableKey}
              clientSecret={stripe.clientSecret}
              returnUrl={`${window.location.origin}/pedido/${created.order.token}`}
              onPaid={(paymentIntentId) => finish(`/api/checkout/${created.order.token}/confirm`, { paymentIntentId })}
            />
          </Suspense>
        )}
        {error && <p className="form-error">{error}</p>}
      </aside>
    </div>
  );
}
