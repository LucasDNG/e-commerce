import { one, query } from './db.js';
import { stripeReady, env } from './env.js';

type ShopRow = {
  store_name: string;
  tagline: string;
  location: string;
  currency: string;
  contact_email: string;
};

type SectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  visible: boolean;
};

type ProductRow = {
  id: string;
  section_id: string | null;
  name: string;
  slug: string;
  summary: string;
  description: string;
  price_cents: number;
  compare_at_cents: number | null;
  sku: string;
  stock: number;
  published: boolean;
  sort_order: number;
};

type ImageRow = {
  id: string;
  product_id: string;
  filename: string;
  alt: string;
  sort_order: number;
};

type OrderRow = {
  id: string;
  number: number;
  public_token: string;
  email: string;
  customer_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  notes: string;
  status: 'pending_payment' | 'paid' | 'stock_failed';
  currency: string;
  total_cents: number;
  payment_provider: string;
  created_at: Date;
  paid_at: Date | null;
};

type ItemRow = {
  id: string;
  order_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image_filename: string | null;
};

export function imagePath(filename: string | null): string | null {
  return filename ? `/uploads/${filename}` : null;
}

export async function getShop() {
  const row = await one<ShopRow>('SELECT store_name, tagline, location, currency, contact_email FROM shop_settings WHERE id = 1');
  if (!row) throw new Error('Faltan los ajustes de la tienda');
  const ready = stripeReady();
  return {
    storeName: row.store_name,
    tagline: row.tagline,
    location: row.location,
    currency: row.currency,
    contactEmail: row.contact_email,
    paymentMode: ready ? ('stripe' as const) : ('demo' as const),
    stripePublishableKey: ready ? env.stripePublishableKey : null,
  };
}

function card(row: ProductRow, filename: string | null) {
  return {
    id: row.id,
    sectionId: row.section_id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    stock: row.stock,
    imageUrl: imagePath(filename),
  };
}

async function coverMap(productIds: string[]): Promise<Map<string, string>> {
  if (productIds.length === 0) return new Map();
  const images = await query<{ product_id: string; filename: string }>(
    `SELECT DISTINCT ON (product_id) product_id, filename
     FROM product_images
     WHERE product_id = ANY($1::uuid[])
     ORDER BY product_id, sort_order, created_at`,
    [productIds],
  );
  return new Map(images.map((image) => [image.product_id, image.filename]));
}

export async function getPublicCatalog() {
  const shop = await getShop();
  const sections = await query<SectionRow>(
    'SELECT id, name, slug, description, sort_order, visible FROM sections WHERE visible ORDER BY sort_order, name',
  );
  const products = await query<ProductRow>(
    `SELECT p.id, p.section_id, p.name, p.slug, p.summary, p.description, p.price_cents,
            p.compare_at_cents, p.sku, p.stock, p.published, p.sort_order
     FROM products p
     LEFT JOIN sections s ON s.id = p.section_id
     WHERE p.published AND (p.section_id IS NULL OR s.visible)
     ORDER BY p.sort_order, p.name`,
  );
  const covers = await coverMap(products.map((product) => product.id));
  const grouped = sections.map((section) => ({
    id: section.id,
    name: section.name,
    slug: section.slug,
    description: section.description,
    products: products.filter((product) => product.section_id === section.id).map((product) => card(product, covers.get(product.id) ?? null)),
  }));
  const loose = products.filter((product) => product.section_id === null);
  if (loose.length > 0) {
    grouped.push({
      id: 'otros',
      name: 'Otros',
      slug: 'otros',
      description: '',
      products: loose.map((product) => card(product, covers.get(product.id) ?? null)),
    });
  }
  return { shop, sections: grouped };
}

export async function getPublicProduct(slug: string) {
  const row = await one<ProductRow & { section_name: string | null; section_slug: string | null }>(
    `SELECT p.id, p.section_id, p.name, p.slug, p.summary, p.description, p.price_cents,
            p.compare_at_cents, p.sku, p.stock, p.published, p.sort_order,
            s.name AS section_name, s.slug AS section_slug
     FROM products p
     LEFT JOIN sections s ON s.id = p.section_id
     WHERE p.slug = $1 AND p.published AND (p.section_id IS NULL OR s.visible)`,
    [slug],
  );
  if (!row) return null;
  const images = await query<ImageRow>(
    `SELECT id, product_id, filename, alt, sort_order
     FROM product_images WHERE product_id = $1 ORDER BY sort_order, created_at`,
    [row.id],
  );
  return {
    ...card(row, images[0]?.filename ?? null),
    description: row.description,
    sku: row.sku,
    images: images.map((image) => ({ id: image.id, url: imagePath(image.filename), alt: image.alt || row.name })),
    section: row.section_id && row.section_name && row.section_slug ? { id: row.section_id, name: row.section_name, slug: row.section_slug } : null,
  };
}

async function imagesByProduct(productIds: string[]): Promise<Map<string, ImageRow[]>> {
  const map = new Map<string, ImageRow[]>();
  if (productIds.length === 0) return map;
  const images = await query<ImageRow>(
    `SELECT id, product_id, filename, alt, sort_order
     FROM product_images WHERE product_id = ANY($1::uuid[])
     ORDER BY sort_order, created_at`,
    [productIds],
  );
  for (const image of images) {
    const list = map.get(image.product_id) ?? [];
    list.push(image);
    map.set(image.product_id, list);
  }
  return map;
}

function adminProduct(row: ProductRow, images: ImageRow[]) {
  return {
    id: row.id,
    sectionId: row.section_id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    sku: row.sku,
    stock: row.stock,
    published: row.published,
    sortOrder: row.sort_order,
    imageUrl: imagePath(images[0]?.filename ?? null),
    images: images.map((image) => ({
      id: image.id,
      url: imagePath(image.filename),
      alt: image.alt,
    })),
  };
}

const productColumns = `id, section_id, name, slug, summary, description, price_cents, compare_at_cents, sku, stock, published, sort_order`;

export async function listAdminProducts() {
  const rows = await query<ProductRow>(
    `SELECT ${productColumns} FROM products ORDER BY sort_order, name`,
  );
  const images = await imagesByProduct(rows.map((row) => row.id));
  return rows.map((row) => adminProduct(row, images.get(row.id) ?? []));
}

export async function getAdminProduct(id: string) {
  const row = await one<ProductRow>(`SELECT ${productColumns} FROM products WHERE id = $1`, [id]);
  if (!row) return null;
  const images = await imagesByProduct([row.id]);
  return adminProduct(row, images.get(row.id) ?? []);
}

export async function listAdminSections() {
  const sections = await query<SectionRow & { product_count: string }>(
    `SELECT s.id, s.name, s.slug, s.description, s.sort_order, s.visible,
            COUNT(p.id)::text AS product_count
     FROM sections s
     LEFT JOIN products p ON p.section_id = s.id
     GROUP BY s.id
     ORDER BY s.sort_order, s.name`,
  );
  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    slug: section.slug,
    description: section.description,
    sortOrder: section.sort_order,
    visible: section.visible,
    productCount: Number(section.product_count),
  }));
}

function orderJson(order: OrderRow, items: ItemRow[]) {
  return {
    id: order.id,
    number: order.number,
    token: order.public_token,
    email: order.email,
    customerName: order.customer_name,
    phone: order.phone,
    addressLine: order.address_line,
    city: order.city,
    postalCode: order.postal_code,
    notes: order.notes,
    status: order.status,
    currency: order.currency,
    totalCents: order.total_cents,
    paymentProvider: order.payment_provider,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      imageUrl: imagePath(item.image_filename),
    })),
  };
}

async function loadOrders(where: string, params: unknown[]) {
  const orders = await query<OrderRow>(
    `SELECT id, number, public_token, email, customer_name, phone, address_line, city, postal_code,
            notes, status, currency, total_cents, payment_provider, created_at, paid_at
     FROM orders ${where} ORDER BY created_at DESC`,
    params,
  );
  if (orders.length === 0) return [];
  const items = await query<ItemRow>(
    `SELECT id, order_id, name, unit_price_cents, quantity, image_filename
     FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at`,
    [orders.map((order) => order.id)],
  );
  return orders.map((order) => orderJson(order, items.filter((item) => item.order_id === order.id)));
}

export async function getOrderByToken(token: string) {
  const orders = await loadOrders('WHERE public_token = $1', [token]);
  return orders[0] ?? null;
}

export async function getOrderById(id: string) {
  const orders = await loadOrders('WHERE id = $1', [id]);
  return orders[0] ?? null;
}

export function listAdminOrders() {
  return loadOrders('', []);
}
