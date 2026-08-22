import { getCategories } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, categories: getCategories() });
}
