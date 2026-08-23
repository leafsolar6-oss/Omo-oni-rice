import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Keep the test database isolated from local development data and ensure a
// developer's production DATABASE_URL can never be used by this test.
const originalCwd = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omo-oni-rice-test-'));
process.chdir(tempDir);
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;

const { createOrder, getOrderByRef, getProduct, getProducts, getSqlite, seed } = await import('../lib/db.js');

const customer = {
  name: 'Test Customer',
  phone: '08012345678',
  email: 'customer@example.com',
  address: '1 Test Street',
  city: 'Ibadan',
  state: 'Oyo',
};

await seed(true);

test('rejects combined cart quantities that exceed available stock', async () => {
  const before = await getProduct(1);
  assert.equal(before.stock, 50);

  await assert.rejects(
    createOrder({
      customer,
      delivery: { method: 'pickup' },
      payment: { method: 'pod' },
      items: [
        { id: 1, variant: 0, qty: 30 },
        { id: 1, variant: 1, qty: 25 },
      ],
    }),
    /no longer has enough stock/
  );

  // The whole transaction must roll back, including its stock reservation.
  const after = await getProduct(1);
  assert.equal(after.stock, 50);
});

test('reserves stock after a valid order', async () => {
  const order = await createOrder({
    customer,
    delivery: { method: 'pickup' },
    payment: { method: 'pod' },
    items: [{ id: 1, variant: 0, qty: 2 }],
  });

  assert.match(order.ref, /^OOR-[A-Z2-9]{6}$/);
  assert.equal(order.subtotal, 23000);
  assert.equal(order.total, 23000);

  const product = await getProduct(1);
  assert.equal(product.stock, 48);
});

test('catalogue migration replaces products and preserves historical order items', async () => {
  const order = await createOrder({
    customer,
    delivery: { method: 'pickup' },
    payment: { method: 'pod' },
    items: [{ id: 1, variant: 0, qty: 1 }],
  });
  getSqlite().prepare("UPDATE app_meta SET value = 'old-catalogue' WHERE key = 'catalog_version'").run();

  await seed(false);

  const products = await getProducts({ limit: 100 });
  assert.equal(products.length, 25);
  assert.deepEqual(
    products.map((p) => p.name).sort(),
    ['Beans', 'Bournvita', 'Crayfish', 'Curry Powder', 'Egusi', 'Elubo', 'Garri',
      'Hypo Fabric Bleach', 'Hypo Toilet Cleaner', 'Maggi Seasoning Cubes', 'Noodles',
      'Oats', 'Onions', 'Oral-B Toothpaste', 'Palm Oil', 'Pepper', 'Poundo Yam', 'Rice',
      'Sack', 'Salt', 'Spaghetti', 'Three Crowns Milk', 'Thyme', 'Tomato Paste',
      'Vegetable Oil'].sort()
  );

  const historical = await getOrderByRef(order.ref);
  assert.equal(historical.items[0].product_name, 'Rice');
  assert.equal(historical.items[0].product_id, null);
});

test.after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
});
