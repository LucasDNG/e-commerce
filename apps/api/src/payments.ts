import Stripe from 'stripe';
import { pool } from './db.js';
import { env } from './env.js';
import { HttpError } from './errors.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new HttpError(400, 'Stripe no está configurado');
  }
  if (!stripeClient) stripeClient = new Stripe(env.stripeSecretKey);
  return stripeClient;
}

export type PaidResult = 'paid' | 'already_paid' | 'stock_failed' | 'missing';

// Reserva el stock recién cuando el pago se confirma, y es idempotente:
// un webhook y la confirmación del navegador pueden llegar los dos.
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<PaidResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query<{ status: string }>('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (found.rowCount === 0) {
      await client.query('ROLLBACK');
      return 'missing';
    }
    const status = found.rows[0].status;
    if (status === 'paid') {
      await client.query('COMMIT');
      return 'already_paid';
    }
    if (status !== 'pending_payment') {
      await client.query('ROLLBACK');
      return 'stock_failed';
    }

    const items = await client.query<{ product_id: string | null; quantity: number }>(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [orderId],
    );

    for (const item of items.rows) {
      if (!item.product_id) {
        await client.query('ROLLBACK');
        await pool.query(`UPDATE orders SET status = 'stock_failed' WHERE id = $1 AND status = 'pending_payment'`, [orderId]);
        return 'stock_failed';
      }
      const updated = await client.query(
        'UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1 AND stock >= $2',
        [item.product_id, item.quantity],
      );
      if (updated.rowCount !== 1) {
        await client.query('ROLLBACK');
        await pool.query(`UPDATE orders SET status = 'stock_failed' WHERE id = $1 AND status = 'pending_payment'`, [orderId]);
        return 'stock_failed';
      }
    }

    await client.query(`UPDATE orders SET status = 'paid', payment_ref = $2, paid_at = now() WHERE id = $1`, [
      orderId,
      paymentRef,
    ]);
    await client.query('COMMIT');
    return 'paid';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function assertStripePayment(orderId: string, paymentIntentId: string): Promise<void> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.metadata.orderId !== orderId) {
    throw new HttpError(400, 'El pago no corresponde a este pedido');
  }
  if (intent.status !== 'succeeded') {
    throw new HttpError(402, 'El pago todavía no está acreditado');
  }
  const order = await pool.query<{ total_cents: number; currency: string }>(
    'SELECT total_cents, currency FROM orders WHERE id = $1',
    [orderId],
  );
  const row = order.rows[0];
  if (!row || intent.amount !== row.total_cents || intent.currency !== row.currency.toLowerCase()) {
    throw new HttpError(400, 'El importe del pago no coincide con el pedido');
  }
}
