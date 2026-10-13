import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';
import { env, stripeReady } from './env.js';
import { HttpError } from './errors.js';
import { getStripe } from './payments.js';

export const checkoutSchema = z.object({
  email: z.string().trim().email('Ingresá un email válido'),
  customerName: z.string().trim().min(2, 'Ingresá el nombre').max(120),
  phone: z.string().trim().max(40).optional().default(''),
  addressLine: z.string().trim().min(4, 'Ingresá la dirección').max(200),
  city: z.string().trim().min(2, 'Ingresá la ciudad').max(80),
  postalCode: z.string().trim().max(20).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'El carrito está vacío')
    .max(30),
});

export const demoPaymentSchema = z.object({
  cardNumber: z.string().trim().min(12, 'Ingresá el número de tarjeta'),
  exp: z.string().trim().min(4, 'Ingresá el vencimiento'),
  cvc: z.string().trim().regex(/^\d{3,4}$/, 'Ingresá el código de seguridad'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  published: boolean;
  filename: string | null;
};

export type CheckoutPayment =
  | { provider: 'demo' }
  | { provider: 'stripe'; clientSecret: string; publishableKey: string };

export async function createCheckout(input: CheckoutInput): Promise<{ token: string; payment: CheckoutPayment }> {
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > 20) throw new HttpError(400, 'Como máximo se pueden llevar 20 unidades de cada producto');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const shop = await client.query<{ currency: string }>('SELECT currency FROM shop_settings WHERE id = 1');
    const currency = shop.rows[0]?.currency ?? 'ARS';
    const ids = [...quantities.keys()];
    const products = await client.query<ProductRow>(
      `SELECT p.id, p.name, p.price_cents, p.stock, p.published,
              (SELECT filename FROM product_images i
                WHERE i.product_id = p.id
                ORDER BY i.sort_order, i.created_at
                LIMIT 1) AS filename
       FROM products p
       LEFT JOIN sections s ON s.id = p.section_id
       WHERE p.id = ANY($1::uuid[])
         AND p.published
         AND (p.section_id IS NULL OR s.visible)
       FOR UPDATE OF p`,
      [ids],
    );
    if (products.rowCount !== ids.length) {
      throw new HttpError(400, 'Un producto del carrito ya no está disponible');
    }

    const byId = new Map(products.rows.map((row) => [row.id, row]));
    let total = 0;
    const lines: { product: ProductRow; quantity: number }[] = [];
    for (const [productId, quantity] of quantities) {
      const product = byId.get(productId);
      if (!product) throw new HttpError(400, 'Un producto del carrito ya no está disponible');
      if (product.stock < quantity) {
        throw new HttpError(400, `No hay stock suficiente de ${product.name}`);
      }
      total += product.price_cents * quantity;
      lines.push({ product, quantity });
    }
    if (total <= 0) throw new HttpError(400, 'El total del pedido tiene que ser mayor a cero');

    const orderId = randomUUID();
    const token = randomUUID();
    const provider = stripeReady() ? 'stripe' : 'demo';
    await client.query(
      `INSERT INTO orders (
         id, public_token, email, customer_name, phone, address_line, city, postal_code, notes,
         status, currency, total_cents, payment_provider
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending_payment',$10,$11,$12)`,
      [
        orderId,
        token,
        input.email,
        input.customerName,
        input.phone,
        input.addressLine,
        input.city,
        input.postalCode,
        input.notes,
        currency,
        total,
        provider,
      ],
    );

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, name, unit_price_cents, quantity, image_filename)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          randomUUID(),
          orderId,
          line.product.id,
          line.product.name,
          line.product.price_cents,
          line.quantity,
          line.product.filename,
        ],
      );
    }

    let payment: CheckoutPayment = { provider: 'demo' };
    if (provider === 'stripe') {
      try {
        const intent = await getStripe().paymentIntents.create(
          {
            amount: total,
            currency: currency.toLowerCase(),
            metadata: { orderId },
            receipt_email: input.email,
            automatic_payment_methods: { enabled: true },
          },
          { idempotencyKey: orderId },
        );
        if (!intent.client_secret) throw new HttpError(502, 'Stripe no devolvió el formulario de pago');
        await client.query('UPDATE orders SET payment_ref = $2 WHERE id = $1', [orderId, intent.id]);
        payment = {
          provider: 'stripe',
          clientSecret: intent.client_secret,
          publishableKey: env.stripePublishableKey,
        };
      } catch (error) {
        if (error instanceof HttpError) throw error;
        const message = error instanceof Error ? error.message : 'Stripe rechazó el pedido';
        throw new HttpError(400, `Stripe rechazó el cobro: ${message}`);
      }
    }

    await client.query('COMMIT');
    return { token, payment };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function assertDemoCard(card: z.infer<typeof demoPaymentSchema>): void {
  const digits = card.cardNumber.replace(/\s+/g, '');
  if (digits !== '4242424242424242') {
    throw new HttpError(402, 'Tarjeta rechazada. En la demostración se aprueba 4242 4242 4242 4242.');
  }
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.exp);
  if (!match) throw new HttpError(400, 'El vencimiento tiene que tener el formato MM/AA');
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) throw new HttpError(400, 'El mes de vencimiento no es válido');
  const now = new Date();
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  if (expired) throw new HttpError(402, 'La tarjeta está vencida');
}
