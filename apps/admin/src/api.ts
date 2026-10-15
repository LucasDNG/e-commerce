const configuredOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const apiOrigin = configuredOrigin || (import.meta.env.PROD ? 'https://caminito-vitrina.onrender.com' : '');
const TOKEN_KEY = 'vitrina.admin.token';

export type Admin = { id: string; email: string; name: string };

export type Shop = {
  storeName: string;
  tagline: string;
  location: string;
  currency: string;
  contactEmail: string;
  paymentMode: 'demo' | 'stripe';
  currencies?: string[];
};

export type Section = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  visible: boolean;
  productCount: number;
};

export type ProductImage = { id: string; url: string | null; alt: string };

export type Product = {
  id: string;
  sectionId: string | null;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  sku: string;
  stock: number;
  published: boolean;
  sortOrder: number;
  imageUrl: string | null;
  images: ProductImage[];
};

export type Order = {
  id: string;
  number: number;
  status: 'pending_payment' | 'paid' | 'stock_failed';
  email: string;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  currency: string;
  totalCents: number;
  createdAt: string;
  items: { id: string; name: string; quantity: number; unitPriceCents: number }[];
};

export function media(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${apiOrigin}${path}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}${path}`, { ...init, headers });
  } catch {
    throw new Error('No se pudo conectar con la tienda');
  }
  if (response.status === 401 && !path.endsWith('/login')) {
    setToken(null);
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: { error?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      throw new Error('La tienda no pudo leer la respuesta del servidor');
    }
  }
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la acción');
  return data as T;
}

export async function download(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiOrigin}${path}`, { headers });
  if (!response.ok) throw new Error('No se pudo descargar el catálogo');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
