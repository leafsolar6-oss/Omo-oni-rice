import { adminProducts, adminCreateProduct } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

async function auth(request) {
  const h = request.headers.get('authorization') || '';
  return getSession(h.startsWith('Bearer ') ? h.slice(7) : '');
}

export async function GET(request) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  return Response.json({ ok: true, ...(await adminProducts()) });
}

export async function POST(request) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const id = await adminCreateProduct(body);
    return Response.json({ ok: true, id, message: 'Product created' }, { status: 201 });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
