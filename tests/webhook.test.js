import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalCwd = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omo-oni-webhook-test-'));
process.chdir(tempDir);
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
process.env.PAYSTACK_SECRET_KEY = 'sk_test_webhook_secret';
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_public';

const { createOrder, getOrderByRef, seed } = await import('../lib/db.js');
const { POST } = await import('../app/api/paystack/webhook/route.js');
await seed(true);

const customer = {
  name: 'Webhook Customer', phone: '08012345678', email: 'webhook@example.com',
  address: '1 Test Street', city: 'Ibadan', state: 'Oyo',
};

function webhookRequest(event) {
  const body = JSON.stringify(event);
  const signature = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');
  return new Request('http://localhost/api/paystack/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-paystack-signature': signature },
    body,
  });
}

test('marks a matching card order paid from charge.success', async () => {
  const order = await createOrder({
    customer,
    delivery: { method: 'pickup' },
    payment: { method: 'card' },
    items: [{ id: 1, variant: 0, qty: 1 }],
  });

  const response = await POST(webhookRequest({
    event: 'charge.success',
    data: { reference: order.ref, amount: order.total * 100, currency: 'NGN', status: 'success' },
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).paid, true);

  const updated = await getOrderByRef(order.ref);
  assert.equal(updated.order.payment_status, 'paid');
  assert.equal(updated.order.status, 'Confirmed');
});

test('ignores a signed event with the wrong amount', async () => {
  const order = await createOrder({
    customer,
    delivery: { method: 'pickup' },
    payment: { method: 'card' },
    items: [{ id: 2, variant: 0, qty: 1 }],
  });

  const response = await POST(webhookRequest({
    event: 'charge.success',
    data: { reference: order.ref, amount: 1, currency: 'NGN', status: 'success' },
  }));
  const result = await response.json();
  assert.equal(result.ignored, true);
  assert.equal(result.reason, 'transaction_mismatch');

  const unchanged = await getOrderByRef(order.ref);
  assert.equal(unchanged.order.payment_status, 'unpaid');
});

test('rejects an invalid webhook signature', async () => {
  const response = await POST(new Request('http://localhost/api/paystack/webhook', {
    method: 'POST',
    headers: { 'x-paystack-signature': 'bad' },
    body: '{}',
  }));
  assert.equal(response.status, 401);
});

test.after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
});
