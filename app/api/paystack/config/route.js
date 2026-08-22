import { isConfigured, getPublicKey } from '../../../../lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * Lets the checkout UI know whether Paystack is live, and hands it the
 * public key for the inline popup. The secret key never leaves the server.
 */
export async function GET() {
  return Response.json({
    ok: true,
    configured: isConfigured(),
    publicKey: isConfigured() ? getPublicKey() : null,
  });
}
