import { adminOrderById, adminSetOrderStatus } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

async function auth(request) {
  const h = request.headers.get('authorization') || '';
  return getSession(h.startsWith('Bearer ') ? h.slice(7) : '');
}

export async function GET(request, { params }) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const found = await adminOrderById(Number(id));
  if (!found) return Response.json({ ok: false, message: 'Order not found' }, { status: 404 });
  return Response.json({ ok: true, ...found });
}

export async function PATCH(request, { params }) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  try {
    const { status } = await request.json().catch(() => ({}));
    await adminSetOrderStatus(Number(id), String(status || ''));
    return Response.json({ ok: true, message: 'Status updated' });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
