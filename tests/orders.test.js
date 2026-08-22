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

const { createOrder, getProduct, seed } = await import('../lib/db.js');

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
  assert.equal(before.stock, 42);

  await assert.rejects(
    createOrder({
      customer,
      delivery: { method: 'pickup' },
      payment: { method: 'pod' },
      items: [
        { id: 1, variant: 0, qty: 30 },
        { id: 1, variant: 1, qty: 20 },
      ],
    }),
    /no longer has enough stock/
  );

  // The whole transaction must roll back, including its stock reservation.
  const after = await getProduct(1);
  assert.equal(after.stock, 42);
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
  assert.equal(product.stock, 40);
});

test.after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
});
