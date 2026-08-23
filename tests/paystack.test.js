import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.PAYSTACK_SECRET_KEY = 'sk_test_webhook_secret';
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_public';

const { verifyWebhookSignature } = await import('../lib/paystack.js');

const payload = JSON.stringify({
  event: 'charge.success',
  data: { reference: 'OOR-ABC234', amount: 2300000, currency: 'NGN', status: 'success' },
});
const signature = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
  .update(payload)
  .digest('hex');

test('accepts a valid Paystack webhook signature', () => {
  assert.equal(verifyWebhookSignature(payload, signature), true);
});

test('rejects tampered payloads and malformed signatures', () => {
  assert.equal(verifyWebhookSignature(`${payload} `, signature), false);
  assert.equal(verifyWebhookSignature(payload, 'not-a-signature'), false);
  assert.equal(verifyWebhookSignature(payload, ''), false);
});
