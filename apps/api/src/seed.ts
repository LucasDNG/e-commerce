import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';
import { pool, query } from './db.js';
import { env } from './env.js';
import { migrate } from './schema.js';
import { seedArt } from './seedArt.js';

type SeedSection = { name: string; slug: string; description: string };
type SeedProduct = {
  section: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  sku: string;
  stock: number;
};

const sections: SeedSection[] = [
  { name: 'Hogar', slug: 'hogar', description: 'Mesa, luz y abrigo.' },
  { name: 'Indumentaria', slug: 'indumentaria', description: 'Prendas simples, bien cortadas.' },
  { name: 'Escritorio', slug: 'escritorio', description: 'Papel y herramientas de todos los días.' },
  { name: 'Cuidado', slug: 'cuidado', description: 'Rituales chicos, sin ruido.' },
];

const products: SeedProduct[] = [
  {
    section: 'hogar',
    name: 'Taza de gres',
    slug: 'taza-de-gres',
    summary: 'Taza baja, esmalte mate, 220 ml.',
    description: 'Gres torneado y esmalte mate color arcilla. El asa queda cerrada para que no gotee, y la base es ancha para que no se vuelque en la mesa.',
    priceCents: 2450000,
    compareAtCents: null,
    sku: 'HOG-TAZA',
    stock: 14,
  },
  {
    section: 'hogar',
    name: 'Manta de lino',
    slug: 'manta-de-lino',
    summary: 'Lino lavado, 130 × 180 cm.',
    description: 'Lino lavado, con el peso justo para el sillón. Se puede lavar en frío y gana textura con el uso. El vivo es del mismo color de la taza.',
    priceCents: 8900000,
    compareAtCents: 9900000,
    sku: 'HOG-MANTA',
    stock: 6,
  },
  {
    section: 'hogar',
    name: 'Lámpara de mesa',
    slug: 'lampara-de-mesa',
    summary: 'Pantalla de papel y base de madera.',
    description: 'Luz cálida, baja, para la mesa de luz o el escritorio. La pantalla es de papel y la base está teñida en verde oscuro. Portalámparas E27.',
    priceCents: 11200000,
    compareAtCents: null,
    sku: 'HOG-LAMP',
    stock: 3,
  },
  {
    section: 'indumentaria',
    name: 'Camisa de algodón',
    slug: 'camisa-de-algodon',
    summary: 'Algodón lavado, corte recto.',
    description: 'Camisa de algodón lavado, sin estructura de más. Corte recto, botones de nácar y un solo bolsillo. Talle único amplio.',
    priceCents: 6200000,
    compareAtCents: null,
    sku: 'IND-CAMISA',
    stock: 9,
  },
  {
    section: 'escritorio',
    name: 'Cuaderno cosido',
    slug: 'cuaderno-cosido',
    summary: '96 páginas de papel ahuesado.',
    description: 'Cosido a la vista, abre plano y no se desarma. Papel de 90 g, ahuesado, para tinta y lápiz. Tapa flexible color papel.',
    priceCents: 1280000,
    compareAtCents: null,
    sku: 'ESC-CUAD',
    stock: 24,
  },
  {
    section: 'escritorio',
    name: 'Tijera de escritorio',
    slug: 'tijera-de-escritorio',
    summary: 'Acero inoxidable, 18 cm.',
    description: 'Tijera corta, con hojas que llegan hasta la punta. Sirve para papel, hilo y el precinto de un paquete. No está pensada para tela gruesa.',
    priceCents: 1860000,
    compareAtCents: null,
    sku: 'ESC-TIJERA',
    stock: 11,
  },
  {
    section: 'cuidado',
    name: 'Jabón de oliva',
    slug: 'jabon-de-oliva',
    summary: 'Barra de 90 g, sin perfume.',
    description: 'Aceite de oliva saponificado, sin perfume ni colorante. La barra es firme y deja la piel suave. Dura más si se apoya en un plato con drenaje.',
    priceCents: 540000,
    compareAtCents: null,
    sku: 'CUI-JABON',
    stock: 30,
  },
  {
    section: 'cuidado',
    name: 'Aceite de manos',
    slug: 'aceite-de-manos',
    summary: 'Botella de 30 ml, romero y almendra.',
    description: 'Aceite de almendra con unas gotas de romero. Se absorbe rápido y no deja la mesa grasosa. Alcanza para un mes de uso diario.',
    priceCents: 970000,
    compareAtCents: null,
    sku: 'CUI-ACEITE',
    stock: 16,
  },
];

export async function seedCatalog(): Promise<void> {
await mkdir(env.uploadDir, { recursive: true });

const admins = await query<{ id: string }>('SELECT id FROM admins WHERE lower(email) = lower($1)', [env.adminEmail]);
if (admins.length === 0) {
  await pool.query('INSERT INTO admins (id, email, password_hash, name) VALUES ($1, $2, $3, $4)', [
    randomUUID(),
    env.adminEmail,
    await hashPassword(env.adminPassword),
    env.adminName,
  ]);
  console.log(`Admin creado: ${env.adminEmail}`);
} else {
  console.log(`Admin ya existía: ${env.adminEmail}`);
}

const sectionIds = new Map<string, string>();
for (const [index, section] of sections.entries()) {
  const found = await query<{ id: string }>('SELECT id FROM sections WHERE slug = $1', [section.slug]);
  if (found[0]) {
    sectionIds.set(section.slug, found[0].id);
    continue;
  }
  const id = randomUUID();
  await pool.query(
    `INSERT INTO sections (id, name, slug, description, sort_order, visible) VALUES ($1, $2, $3, $4, $5, true)`,
    [id, section.name, section.slug, section.description, index],
  );
  sectionIds.set(section.slug, id);
}

for (const [index, product] of products.entries()) {
  let productId: string;
  const found = await query<{ id: string }>('SELECT id FROM products WHERE slug = $1', [product.slug]);
  if (found[0]) {
    productId = found[0].id;
  } else {
    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, section_id, name, slug, summary, description, price_cents, compare_at_cents, sku, stock, published, sort_order
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)`,
      [
        productId,
        sectionIds.get(product.section) ?? null,
        product.name,
        product.slug,
        product.summary,
        product.description,
        product.priceCents,
        product.compareAtCents,
        product.sku,
        product.stock,
        index,
      ],
    );
  }

  const images = await query('SELECT id FROM product_images WHERE product_id = $1', [productId]);
  const svg = seedArt[product.slug];
  if (svg) {
    const filename = `seed-${product.slug}.svg`;
    try {
      await access(join(env.uploadDir, filename));
    } catch {
      await writeFile(join(env.uploadDir, filename), svg);
    }
    if (images.length === 0) {
      await pool.query(
        `INSERT INTO product_images (id, product_id, filename, alt, sort_order) VALUES ($1, $2, $3, $4, 0)`,
        [randomUUID(), productId, filename, product.name],
      );
    }
  }
}

console.log('Catálogo de muestra listo.');
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  await migrate();
  await seedCatalog();
  await pool.end();
}
