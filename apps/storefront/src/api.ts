export const apiOrigin = import.meta.env.VITE_API_URL ?? '';

export type Shop = {
  storeName: string;
  tagline: string;
  currency: string;
  contactEmail: string;
  paymentMode: 'demo' | 'stripe';
  stripePublishableKey: string | null;
};

export type ProductCard = {
  id: string;
  sectionId: string | null;
  name: string;
  slug: string;
  summary: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  imageUrl: string | null;
};

export type Section = {
  id: string;
  name: string;
  slug: string;
  description: string;
  products: ProductCard[];
};

export type Catalog = { shop: Shop; sections: Section[] };

export type Product = ProductCard & {
  description: string;
  sku: string;
  images: { id: string; url: string | null; alt: string }[];
  section: { id: string; name: string; slug: string } | null;
};

export type Order = {
  id: string;
  number: number;
  token: string;
  email: string;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  notes: string;
  status: 'pending_payment' | 'paid' | 'stock_failed';
  currency: string;
  totalCents: number;
  paymentProvider: string;
  createdAt: string;
  paidAt: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    imageUrl: string | null;
  }[];
};

export type CheckoutResponse = {
  order: Order;
  payment: { provider: 'demo' } | { provider: 'stripe'; clientSecret: string; publishableKey: string };
};

export function media(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${apiOrigin}${path}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiOrigin}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { error?: string }) : {};
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la acción');
  return data as T;
}
