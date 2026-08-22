import { subscribeNewsletter } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email } = await request.json().catch(() => ({}));
    await subscribeNewsletter(email);
    return Response.json({ ok: true, message: 'Subscribed!' });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 400 });
  }
}
