import { getProducts } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const products = getProducts({
    category: sp.get('category'),
    search: sp.get('search'),
    sort: sp.get('sort'),
    featured: sp.get('featured'),
    deal: sp.get('deal'),
    ids: sp.get('ids'),
    limit: sp.get('limit'),
    offset: sp.get('offset'),
  });
  return Response.json({ ok: true, products, total: products.length });
}
