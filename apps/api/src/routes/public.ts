import type { Express, Response } from 'express';
import { z } from 'zod';
import { getOrderByToken, getPublicCatalog, getPublicProduct } from '../catalog.js';
import { assertDemoCard, checkoutSchema, createCheckout, demoPaymentSchema } from '../checkout.js';
import { one } from '../db.js';
import { HttpError } from '../errors.js';
import { wrap, zodMessage } from '../http.js';
import { assertStripePayment, markOrderPaid, type PaidResult } from '../payments.js';

const tokenSchema = z.string().uuid();

async function respondPaid(res: Response, token: string, result: PaidResult) {
  if (result === 'stock_failed') {
    throw new HttpError(409, 'No hay stock suficiente para completar el pedido');
  }
  if (result === 'missing') throw new HttpError(404, 'Pedido no encontrado');
  res.json({ order: await getOrderByToken(token) });
}

export function mountPublic(app: Express): void {
  app.get(
    '/api/health',
    wrap(async (_req, res) => {
      res.json({ ok: true });
    }),
  );

  app.get(
    '/api/catalog',
    wrap(async (_req, res) => {
      res.json(await getPublicCatalog());
    }),
  );

  app.get(
    '/api/products/:slug',
    wrap(async (req, res) => {
      const product = await getPublicProduct(req.params.slug);
      if (!product) throw new HttpError(404, 'Producto no encontrado');
      res.json(product);
    }),
  );

  app.post(
    '/api/checkout',
    wrap(async (req, res) => {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const { token, payment } = await createCheckout(parsed.data);
      res.status(201).json({ order: await getOrderByToken(token), payment });
    }),
  );

  app.post(
    '/api/checkout/:token/confirm',
    wrap(async (req, res) => {
      if (!tokenSchema.safeParse(req.params.token).success) {
        throw new HttpError(404, 'Pedido no encontrado');
      }
      const order = await one<{ id: string; payment_provider: string }>(
        'SELECT id, payment_provider FROM orders WHERE public_token = $1',
        [req.params.token],
      );
      if (!order) throw new HttpError(404, 'Pedido no encontrado');

      if (order.payment_provider === 'stripe') {
        const body = z.object({ paymentIntentId: z.string().min(3) }).safeParse(req.body);
        if (!body.success) throw new HttpError(400, 'Falta la confirmación del pago');
        await assertStripePayment(order.id, body.data.paymentIntentId);
        const result = await markOrderPaid(order.id, body.data.paymentIntentId);
        await respondPaid(res, req.params.token, result);
        return;
      }

      const card = demoPaymentSchema.safeParse(req.body);
      if (!card.success) throw new HttpError(400, zodMessage(card.error));
      assertDemoCard(card.data);
      const result = await markOrderPaid(order.id, 'demo');
      await respondPaid(res, req.params.token, result);
    }),
  );

  app.get(
    '/api/orders/:token',
    wrap(async (req, res) => {
      if (!tokenSchema.safeParse(req.params.token).success) {
        throw new HttpError(404, 'Pedido no encontrado');
      }
      const order = await getOrderByToken(req.params.token);
      if (!order) throw new HttpError(404, 'Pedido no encontrado');
      res.json(order);
    }),
  );
}
