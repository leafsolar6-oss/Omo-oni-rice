import { adminUpdateProduct, adminDeleteProduct } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

async function auth(request) {
  const h = request.headers.get('authorization') || '';
  return getSession(h.startsWith('Bearer ') ? h.slice(7) : '');
}

export async function PATCH(request, { params }) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    await adminUpdateProduct(Number(id), body);
    return Response.json({ ok: true, message: 'Product updated' });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await auth(request))) return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  try {
    await adminDeleteProduct(Number(id));
    return Response.json({ ok: true, message: 'Product deleted' });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
