import { randomUUID } from 'node:crypto';
import type { Express, Request } from 'express';
import { getAdminProduct, getShop, listAdminOrders, listAdminProducts, listAdminSections } from '../catalog.js';
import { pool, query } from '../db.js';
import { CURRENCIES } from '../env.js';
import { HttpError, isForeignKeyViolation, isUniqueViolation } from '../errors.js';
import { wrap, zodMessage } from '../http.js';
import {
  assertLoginAllowed,
  checkPassword,
  clearLoginFailures,
  recordLoginFailure,
  requireAdmin,
  signAdmin,
} from '../auth.js';
import {
  loginSchema,
  productPatchSchema,
  productReorderSchema,
  productWriteSchema,
  reorderSchema,
  sectionPatchSchema,
  sectionWriteSchema,
  settingsSchema,
} from '../schemas.js';
import { slugify, uniqueSlug } from '../slug.js';
import { removeImage, saveImage, upload } from '../uploads.js';

async function nextSlug(table: 'products' | 'sections', name: string): Promise<string> {
  const base = slugify(name, table === 'products' ? 'producto' : 'seccion');
  const rows = await query<{ slug: string }>(`SELECT slug FROM ${table} WHERE slug = $1 OR slug LIKE $2`, [
    base,
    `${base}-%`,
  ]);
  return uniqueSlug(base, new Set(rows.map((row) => row.slug)));
}

function filesOf(req: Request): Express.Multer.File[] {
  if (Array.isArray(req.files)) return req.files;
  return [];
}

export function mountAdmin(app: Express): void {
  app.post(
    '/api/admin/login',
    wrap(async (req, res) => {
      assertLoginAllowed(req.ip ?? 'local');
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const admin = await query<{ id: string; email: string; name: string; password_hash: string }>(
        'SELECT id, email, name, password_hash FROM admins WHERE lower(email) = lower($1)',
        [parsed.data.email],
      );
      const row = admin[0];
      const valid = row ? await checkPassword(parsed.data.password, row.password_hash) : false;
      if (!row || !valid) {
        recordLoginFailure(req.ip ?? 'local');
        throw new HttpError(401, 'Email o contraseña incorrectos');
      }
      clearLoginFailures(req.ip ?? 'local');
      const session = { id: row.id, email: row.email, name: row.name };
      res.json({ token: signAdmin(session), admin: session });
    }),
  );

  app.get(
    '/api/admin/me',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(res.locals.admin);
    }),
  );

  app.get(
    '/api/admin/settings',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json({ ...(await getShop()), currencies: CURRENCIES });
    }),
  );

  app.patch(
    '/api/admin/settings',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = settingsSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      await pool.query(
        `UPDATE shop_settings
         SET store_name = $1, tagline = $2, currency = $3, contact_email = $4, updated_at = now()
         WHERE id = 1`,
        [parsed.data.storeName, parsed.data.tagline, parsed.data.currency, parsed.data.contactEmail],
      );
      res.json(await getShop());
    }),
  );

  app.get(
    '/api/admin/sections',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await listAdminSections());
    }),
  );

  app.post(
    '/api/admin/sections',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = sectionWriteSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const id = randomUUID();
      const slug = await nextSlug('sections', parsed.data.name);
      const order = await query<{ n: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM sections');
      try {
        await pool.query(
          `INSERT INTO sections (id, name, slug, description, sort_order, visible)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, parsed.data.name, slug, parsed.data.description, order[0]?.n ?? 0, parsed.data.visible],
        );
      } catch (error) {
        if (isUniqueViolation(error)) throw new HttpError(409, 'Ya existe una sección con ese nombre');
        throw error;
      }
      const sections = await listAdminSections();
      res.status(201).json(sections.find((section) => section.id === id));
    }),
  );

  app.patch(
    '/api/admin/sections/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = sectionPatchSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const current = await query('SELECT id FROM sections WHERE id = $1', [req.params.id]);
      if (current.length === 0) throw new HttpError(404, 'Sección no encontrada');
      const sets: string[] = [];
      const values: unknown[] = [];
      const set = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };
      if (parsed.data.name !== undefined) set('name', parsed.data.name);
      if (parsed.data.description !== undefined) set('description', parsed.data.description);
      if (parsed.data.visible !== undefined) set('visible', parsed.data.visible);
      if (sets.length === 0) throw new HttpError(400, 'No hay cambios');
      sets.push('updated_at = now()');
      values.push(req.params.id);
      await pool.query(`UPDATE sections SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
      const sections = await listAdminSections();
      res.json(sections.find((section) => section.id === req.params.id));
    }),
  );

  app.delete(
    '/api/admin/sections/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const result = await pool.query('DELETE FROM sections WHERE id = $1', [req.params.id]);
      if (result.rowCount === 0) throw new HttpError(404, 'Sección no encontrada');
      res.status(204).end();
    }),
  );

  app.post(
    '/api/admin/sections/reorder',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = reorderSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const existing = await query<{ id: string }>('SELECT id FROM sections');
      const incoming = new Set(parsed.data.ids);
      if (existing.length !== parsed.data.ids.length || existing.some((row) => !incoming.has(row.id))) {
        throw new HttpError(400, 'El orden tiene que incluir todas las secciones');
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (let index = 0; index < parsed.data.ids.length; index += 1) {
          await client.query('UPDATE sections SET sort_order = $2, updated_at = now() WHERE id = $1', [
            parsed.data.ids[index],
            index,
          ]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      res.json(await listAdminSections());
    }),
  );

  app.get(
    '/api/admin/products',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await listAdminProducts());
    }),
  );

  app.get(
    '/api/admin/products/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const product = await getAdminProduct(req.params.id);
      if (!product) throw new HttpError(404, 'Producto no encontrado');
      res.json(product);
    }),
  );

  app.post(
    '/api/admin/products',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = productWriteSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      await assertSection(parsed.data.sectionId);
      const id = randomUUID();
      const slug = await nextSlug('products', parsed.data.name);
      const order = await query<{ n: number }>(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM products WHERE section_id IS NOT DISTINCT FROM $1',
        [parsed.data.sectionId],
      );
      try {
        await pool.query(
          `INSERT INTO products (
             id, section_id, name, slug, summary, description, price_cents, compare_at_cents, sku, stock, published, sort_order
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            id,
            parsed.data.sectionId,
            parsed.data.name,
            slug,
            parsed.data.summary,
            parsed.data.description,
            parsed.data.priceCents,
            parsed.data.compareAtCents,
            parsed.data.sku,
            parsed.data.stock,
            parsed.data.published,
            order[0]?.n ?? 0,
          ],
        );
      } catch (error) {
        if (isForeignKeyViolation(error)) throw new HttpError(400, 'La sección no existe');
        if (isUniqueViolation(error)) throw new HttpError(409, 'Ya existe un producto con ese nombre');
        throw error;
      }
      res.status(201).json(await getAdminProduct(id));
    }),
  );

  app.patch(
    '/api/admin/products/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = productPatchSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const current = await query<{
        price_cents: number;
        compare_at_cents: number | null;
        section_id: string | null;
      }>('SELECT price_cents, compare_at_cents, section_id FROM products WHERE id = $1', [req.params.id]);
      const row = current[0];
      if (!row) throw new HttpError(404, 'Producto no encontrado');
      const price = parsed.data.priceCents ?? row.price_cents;
      const compare = parsed.data.compareAtCents === undefined ? row.compare_at_cents : parsed.data.compareAtCents;
      if (compare !== null && compare <= price) {
        throw new HttpError(400, 'El precio anterior tiene que ser mayor al precio');
      }
      if (parsed.data.sectionId) await assertSection(parsed.data.sectionId);

      const sets: string[] = [];
      const values: unknown[] = [];
      const set = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };
      if (parsed.data.name !== undefined) set('name', parsed.data.name);
      if (parsed.data.summary !== undefined) set('summary', parsed.data.summary);
      if (parsed.data.description !== undefined) set('description', parsed.data.description);
      if (parsed.data.priceCents !== undefined) set('price_cents', parsed.data.priceCents);
      if (parsed.data.compareAtCents !== undefined) set('compare_at_cents', parsed.data.compareAtCents);
      if (parsed.data.sku !== undefined) set('sku', parsed.data.sku);
      if (parsed.data.stock !== undefined) set('stock', parsed.data.stock);
      if (parsed.data.published !== undefined) set('published', parsed.data.published);
      if (parsed.data.sectionId !== undefined && parsed.data.sectionId !== row.section_id) {
        set('section_id', parsed.data.sectionId);
        const order = await query<{ n: number }>(
          'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM products WHERE section_id IS NOT DISTINCT FROM $1',
          [parsed.data.sectionId],
        );
        set('sort_order', order[0]?.n ?? 0);
      }
      if (sets.length === 0) throw new HttpError(400, 'No hay cambios');
      sets.push('updated_at = now()');
      values.push(req.params.id);
      try {
        await pool.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
      } catch (error) {
        if (isForeignKeyViolation(error)) throw new HttpError(400, 'La sección no existe');
        throw error;
      }
      res.json(await getAdminProduct(req.params.id));
    }),
  );

  app.delete(
    '/api/admin/products/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const images = await query<{ filename: string }>('SELECT filename FROM product_images WHERE product_id = $1', [
        req.params.id,
      ]);
      const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
      if (result.rowCount === 0) throw new HttpError(404, 'Producto no encontrado');
      await Promise.all(images.map((image) => removeImage(image.filename)));
      res.status(204).end();
    }),
  );

  app.post(
    '/api/admin/products/reorder',
    requireAdmin,
    wrap(async (req, res) => {
      const parsed = productReorderSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, zodMessage(parsed.error));
      const existing = await query<{ id: string }>(
        'SELECT id FROM products WHERE section_id IS NOT DISTINCT FROM $1',
        [parsed.data.sectionId],
      );
      const incoming = new Set(parsed.data.ids);
      if (existing.length !== parsed.data.ids.length || existing.some((row) => !incoming.has(row.id))) {
        throw new HttpError(400, 'El orden tiene que incluir todos los productos de la sección');
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (let index = 0; index < parsed.data.ids.length; index += 1) {
          await client.query('UPDATE products SET sort_order = $2, updated_at = now() WHERE id = $1', [
            parsed.data.ids[index],
            index,
          ]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      res.json(await listAdminProducts());
    }),
  );

  app.post(
    '/api/admin/products/:id/images',
    requireAdmin,
    upload.array('images', 6),
    wrap(async (req, res) => {
      const product = await query<{ id: string; name: string }>('SELECT id, name FROM products WHERE id = $1', [req.params.id]);
      if (product.length === 0) throw new HttpError(404, 'Producto no encontrado');
      const incoming = filesOf(req);
      if (incoming.length === 0) throw new HttpError(400, 'Elegí al menos una imagen');
      const current = await query<{ n: string }>('SELECT COUNT(*)::text AS n FROM product_images WHERE product_id = $1', [
        req.params.id,
      ]);
      const count = Number(current[0]?.n ?? 0);
      if (count + incoming.length > 6) throw new HttpError(400, 'Cada producto acepta hasta 6 fotos');
      let order = count;
      for (const file of incoming) {
        const filename = await saveImage(file.buffer);
        await pool.query(
          `INSERT INTO product_images (id, product_id, filename, alt, sort_order) VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), req.params.id, filename, product[0].name, order],
        );
        order += 1;
      }
      res.status(201).json(await getAdminProduct(req.params.id));
    }),
  );

  app.delete(
    '/api/admin/products/:id/images/:imageId',
    requireAdmin,
    wrap(async (req, res) => {
      const images = await query<{ filename: string }>(
        'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING filename',
        [req.params.imageId, req.params.id],
      );
      if (images.length === 0) throw new HttpError(404, 'Imagen no encontrada');
      await removeImage(images[0].filename);
      res.json(await getAdminProduct(req.params.id));
    }),
  );

  app.get(
    '/api/admin/orders',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await listAdminOrders());
    }),
  );

  app.get(
    '/api/admin/export.json',
    requireAdmin,
    wrap(async (_req, res) => {
      const payload = {
        shop: await getShop(),
        sections: await listAdminSections(),
        products: await listAdminProducts(),
      };
      res.setHeader('Content-Disposition', 'attachment; filename="catalogo.json"');
      res.json(payload);
    }),
  );

  app.get(
    '/api/admin/export.csv',
    requireAdmin,
    wrap(async (_req, res) => {
      const sections = await listAdminSections();
      const names = new Map(sections.map((section) => [section.id, section.name]));
      const products = await listAdminProducts();
      const header = ['seccion', 'nombre', 'slug', 'precio', 'precio_anterior', 'stock', 'publicado', 'sku', 'resumen'];
      const lines = [header.join(',')];
      for (const product of products) {
        lines.push(
          [
            csv(names.get(product.sectionId ?? '') ?? ''),
            csv(product.name),
            csv(product.slug),
            (product.priceCents / 100).toFixed(2),
            product.compareAtCents === null ? '' : (product.compareAtCents / 100).toFixed(2),
            product.stock,
            product.published ? 'si' : 'no',
            csv(product.sku),
            csv(product.summary),
          ].join(','),
        );
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="catalogo.csv"');
      res.send(`\uFEFF${lines.join('\n')}`);
    }),
  );
}

async function assertSection(sectionId: string | null): Promise<void> {
  if (!sectionId) return;
  const rows = await query('SELECT id FROM sections WHERE id = $1', [sectionId]);
  if (rows.length === 0) throw new HttpError(400, 'La sección no existe');
}

function csv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
