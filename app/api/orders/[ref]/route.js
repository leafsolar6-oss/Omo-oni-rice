import { getOrderByRef } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { ref } = await params;
  const found = await getOrderByRef(ref);
  if (!found) return Response.json({ ok: false, message: 'Order not found. Check the reference and try again.' }, { status: 404 });
  return Response.json({ ok: true, ...found });
}
