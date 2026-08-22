import { adminLogin } from '../../../../lib/db';
import { createSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { username = '', password = '' } = await request.json().catch(() => ({}));
  const admin = adminLogin(String(username).trim(), String(password));
  if (!admin) return Response.json({ ok: false, message: 'Invalid username or password' }, { status: 401 });
  return Response.json({ ok: true, token: createSession(admin.username), username: admin.username });
}
