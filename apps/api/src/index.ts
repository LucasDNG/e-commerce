import { mkdir } from 'node:fs/promises';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { pool } from './db.js';
import { env, stripeReady } from './env.js';
import { HttpError } from './errors.js';
import { zodMessage } from './http.js';
import { getStripe, markOrderPaid } from './payments.js';
import { mountAdmin } from './routes/admin.js';
import { mountPublic } from './routes/public.js';
import { migrate } from './schema.js';
import type Stripe from 'stripe';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
        res.status(400).json({ error: 'Stripe webhook no configurado' });
        return;
      }
      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(req.body as Buffer, req.header('stripe-signature') ?? '', env.stripeWebhookSecret);
      } catch {
        res.status(400).json({ error: 'Firma inválida' });
        return;
      }
      if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata.orderId;
        if (orderId) {
          const order = await pool.query<{ total_cents: number; currency: string }>(
            'SELECT total_cents, currency FROM orders WHERE id = $1',
            [orderId],
          );
          const row = order.rows[0];
          if (row && intent.amount === row.total_cents && intent.currency === row.currency.toLowerCase()) {
            await markOrderPaid(orderId, intent.id);
          }
        }
      }
      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },
);

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: env.corsOrigins, allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'] }));
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});
app.use(
  '/uploads',
  express.static(env.uploadDir, {
    fallthrough: false,
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

mountPublic(app);
mountAdmin(app);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: zodMessage(error) });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: 'La imagen no puede superar 4 MB' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error && (error as { status?: number }).status === 404) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno' });
});

await migrate();
await mkdir(env.uploadDir, { recursive: true });

app.listen(env.port, '0.0.0.0', () => {
  console.log(`API en http://localhost:${env.port}`);
  console.log(stripeReady() ? 'Pagos: Stripe' : 'Pagos: demostración en la página');
});
