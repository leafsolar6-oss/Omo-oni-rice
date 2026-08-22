import { getSession, destroySession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const h = request.headers.get('authorization') || '';
  destroySession(h.startsWith('Bearer ') ? h.slice(7) : '');
  return Response.json({ ok: true, message: 'Logged out' });
}
