import { getProduct, getRelated } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) return Response.json({ ok: false, message: 'Product not found' }, { status: 404 });
  return Response.json({ ok: true, product, related: getRelated(product) });
}
