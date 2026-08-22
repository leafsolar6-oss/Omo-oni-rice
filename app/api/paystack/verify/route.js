import { getOrderByRef, markOrderPaid } from '../../../../lib/db';
import { isConfigured, verifyTransaction } from '../../../../lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * Confirms a card payment and marks the order as paid.
 * - With Paystack keys configured: verifies the transaction server-side
 *   (status + exact kobo amount) before marking the order paid.
 * - Without keys (local demo): marks the order paid directly and flags the
 *   response as demo so the UI can label it clearly.
 */
export async function POST(request) {
  try {
    const { reference } = await request.json().catch(() => ({}));
    const ref = String(reference || '').trim().toUpperCase();
    const found = await getOrderByRef(ref);
    if (!found) {
      return Response.json({ ok: false, message: 'Order not found' }, { status: 404 });
    }
    const { order } = found;

    if (order.payment_status === 'paid') {
      return Response.json({ ok: true, paid: true, already: true });
    }

    if (isConfigured()) {
      const tx = await verifyTransaction(ref);
      if (tx.status !== 'success') {
        return Response.json({ ok: false, message: 'Payment was not successful. Please try again.' }, { status: 402 });
      }
      const expected = Math.round(Number(order.total) * 100); // kobo
      if (tx.amount !== expected) {
        return Response.json({ ok: false, message: 'Payment amount mismatch. Please contact support.' }, { status: 402 });
      }
      await markOrderPaid(ref);
      return Response.json({ ok: true, paid: true, demo: false });
    }

    // Demo mode — no Paystack keys configured on this server
    await markOrderPaid(ref);
    return Response.json({ ok: true, paid: true, demo: true });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
