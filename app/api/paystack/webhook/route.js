import { getOrderByRef, markOrderPaid } from '../../../../lib/db.js';
import { verifyWebhookSignature } from '../../../../lib/paystack.js';

export const dynamic = 'force-dynamic';

/**
 * Paystack sends charge.success events here even if the customer's browser is
 * closed before it returns to the store. The HMAC signature makes the event
 * safe to trust; amount, currency, payment method and order reference are all
 * checked before an order is marked paid.
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ ok: false, message: 'Invalid webhook signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false, message: 'Invalid JSON payload' }, { status: 400 });
  }

  // Acknowledge unrelated events so Paystack does not keep retrying them.
  if (event.event !== 'charge.success') return Response.json({ ok: true, ignored: true });

  const tx = event.data || {};
  const ref = String(tx.reference || '').trim().toUpperCase();
  const found = await getOrderByRef(ref);
  if (!found) return Response.json({ ok: true, ignored: true, reason: 'order_not_found' });

  const { order } = found;
  const expectedAmount = Math.round(Number(order.total) * 100);
  if (
    order.payment_method !== 'card' ||
    tx.status !== 'success' ||
    String(tx.currency || '').toUpperCase() !== 'NGN' ||
    Number(tx.amount) !== expectedAmount
  ) {
    return Response.json({ ok: true, ignored: true, reason: 'transaction_mismatch' });
  }

  await markOrderPaid(ref);
  return Response.json({ ok: true, paid: true });
}
