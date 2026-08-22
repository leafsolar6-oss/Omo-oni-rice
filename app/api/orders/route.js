import { createOrder } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const order = createOrder(body);
    return Response.json({ ok: true, order }, { status: 201 });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
