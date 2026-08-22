import { adminOrders } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const h = request.headers.get('authorization') || '';
  if (!(await getSession(h.startsWith('Bearer ') ? h.slice(7) : ''))) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  return Response.json({ ok: true, orders: await adminOrders({ status: sp.get('status'), q: sp.get('q') }) });
}
