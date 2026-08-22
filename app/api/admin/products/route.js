import { adminProducts, adminCreateProduct } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function auth(request) {
  const h = request.headers.get('authorization') || '';
  return getSession(h.startsWith('Bearer ') ? h.slice(7) : '');
}

export async function GET(request) {
  if (!auth(request)) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  return Response.json({ ok: true, ...adminProducts() });
}

export async function POST(request) {
  if (!auth(request)) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const id = adminCreateProduct(body);
    return Response.json({ ok: true, id, message: 'Product created' }, { status: 201 });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
