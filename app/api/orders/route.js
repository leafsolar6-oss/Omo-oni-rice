import { createOrder } from '../../../lib/db';
import { initializeTransaction, isConfigured } from '../../../lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const order = createOrder(body);

    // Card payments: start a Paystack transaction for this order
    let paystack = null;
    let paystackError = null;
    if (order.payment_method === 'card' && isConfigured()) {
      try {
        paystack = await initializeTransaction({
          email: order.email,
          amount: order.total,
          reference: order.ref,
          callbackUrl: `${request.nextUrl.origin}/order?ref=${encodeURIComponent(order.ref)}`,
        });
      } catch (e) {
        paystackError = e.message;
      }
    }

    return Response.json(
      { ok: true, order, paystack, paystack_error: paystackError, paystack_configured: isConfigured() },
      { status: 201 }
    );
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
