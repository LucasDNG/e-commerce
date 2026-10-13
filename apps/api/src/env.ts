import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(srcDir, '../../..');

dotenv.config({ path: resolve(rootDir, '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en el archivo .env`);
  }
  return value;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@vitrina.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'cambiar-esta-clave',
  adminName: process.env.ADMIN_NAME ?? 'Admin',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  uploadDir: resolve(srcDir, '../uploads'),
};

export function stripeReady(): boolean {
  return Boolean(env.stripeSecretKey && env.stripePublishableKey);
}

export const CURRENCIES = ['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'UYU', 'BRL', 'COP'] as const;
export type Currency = (typeof CURRENCIES)[number];
