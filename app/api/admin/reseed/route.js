import { seed } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Admin-only: wipes ALL data (orders, products, customers, sessions) and
 * restores the fresh demo catalogue + sample orders. Requires a valid admin
 * session; the session table is dropped too, so the caller must sign in again.
 */
export async function POST(request) {
  const h = request.headers.get('authorization') || '';
  if (!(await getSession(h.startsWith('Bearer ') ? h.slice(7) : ''))) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  }
  try {
    await seed(true);
    return Response.json({ ok: true, message: 'Demo data reset' });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 500 });
  }
}
