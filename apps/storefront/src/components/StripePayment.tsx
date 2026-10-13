import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { FormEvent, useMemo, useState } from 'react';

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#c24e1d',
    colorText: '#1b1714',
    colorBackground: '#fffcf7',
    borderRadius: '12px',
    fontFamily: 'Outfit, sans-serif',
  },
};

function PayForm({ returnUrl, onPaid }: { returnUrl: string; onPaid: (paymentIntentId: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message ?? 'No se pudo cobrar');
      setBusy(false);
      return;
    }
    const intent = result.paymentIntent;
    if (intent?.status === 'succeeded') {
      try {
        await onPaid(intent.id);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo confirmar el pedido');
        setBusy(false);
      }
      return;
    }
    setError('El pago no quedó confirmado');
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="pay-form">
      <PaymentElement />
      {error && <p className="form-error">{error}</p>}
      <button className="btn" type="submit" disabled={!stripe || busy}>
        {busy ? 'Cobrando…' : 'Pagar'}
      </button>
    </form>
  );
}

export default function StripePayment({
  publishableKey,
  clientSecret,
  returnUrl,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance, locale: 'es' }}>
      <PayForm returnUrl={returnUrl} onPaid={onPaid} />
    </Elements>
  );
}
