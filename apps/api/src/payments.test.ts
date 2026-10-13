import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { pool } from './db.js';
import { markOrderPaid } from './payments.js';
import { migrate } from './schema.js';

after(async () => {
  await pool.end();
});

test('el stock baja una sola vez y el segundo pedido falla', async () => {
  await migrate();
  const productId = randomUUID();
  const firstOrder = randomUUID();
  const secondOrder = randomUUID();
  const slug = `test-${productId.slice(0, 8)}`;

  await pool.query(
    `INSERT INTO products (id, name, slug, price_cents, stock, published)
     VALUES ($1, 'Producto de prueba', $2, 1000, 1, true)`,
    [productId, slug],
  );

  for (const orderId of [firstOrder, secondOrder]) {
    await pool.query(
      `INSERT INTO orders (id, public_token, email, customer_name, address_line, city, status, currency, total_cents, payment_provider)
       VALUES ($1, $2, 'test@vitrina.local', 'Prueba', 'Calle 1', 'Ciudad', 'pending_payment', 'ARS', 1000, 'demo')`,
      [orderId, randomUUID()],
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, name, unit_price_cents, quantity)
       VALUES ($1, $2, $3, 'Producto de prueba', 1000, 1)`,
      [randomUUID(), orderId, productId],
    );
  }

  try {
    assert.equal(await markOrderPaid(firstOrder, 'demo-1'), 'paid');
    assert.equal(await markOrderPaid(firstOrder, 'demo-1'), 'already_paid');
    assert.equal(await markOrderPaid(secondOrder, 'demo-2'), 'stock_failed');

    const stock = await pool.query<{ stock: number }>('SELECT stock FROM products WHERE id = $1', [productId]);
    assert.equal(stock.rows[0].stock, 0);
    const second = await pool.query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [secondOrder]);
    assert.equal(second.rows[0].status, 'stock_failed');
  } finally {
    await pool.query('DELETE FROM orders WHERE id = ANY($1::uuid[])', [[firstOrder, secondOrder]]);
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
  }
});
