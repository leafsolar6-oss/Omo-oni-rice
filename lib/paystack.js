import crypto from 'crypto';

/**
 * Paystack integration (server-only).
 * Keys come from environment variables:
 *   PAYSTACK_SECRET_KEY              — secret key (never exposed to the browser)
 *   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY  — public key (safe to expose, used by the inline popup)
 *
 * When no keys are configured, `isConfigured()` returns false and the app
 * falls back to a clearly-labelled DEMO payment flow so the site remains
 * fully testable without credentials.
 */

const SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export const isConfigured = () => Boolean(SECRET) && Boolean(PUBLIC);
export const getPublicKey = () => PUBLIC;

/** Verify that an incoming webhook was signed by Paystack. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!SECRET || typeof rawBody !== 'string' || !/^[a-f0-9]{128}$/i.test(signature || '')) return false;
  const expected = crypto.createHmac('sha512', SECRET).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

const PAYSTACK_API = 'https://api.paystack.co';

/**
 * Create a transaction with Paystack and return its authorization data.
 * amount is in naira; Paystack wants kobo.
 */
export async function initializeTransaction({ email, amount, reference, callbackUrl, metadata = {} }) {
  if (!isConfigured()) {
    throw new Error('Paystack is not configured. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local');
  }
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(Number(amount) * 100), // naira → kobo
      reference,
      currency: 'NGN',
      callback_url: callbackUrl,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      metadata: { order_ref: reference, ...metadata },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.status) {
    throw new Error(data.message || 'Paystack could not start the payment');
  }
  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Confirm a transaction with Paystack. Returns the transaction object.
 */
export async function verifyTransaction(reference) {
  if (!isConfigured()) {
    throw new Error('Paystack is not configured');
  }
  const res = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${SECRET}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!data.status) {
    throw new Error(data.message || 'Could not verify the payment with Paystack');
  }
  return data.data; // { status, amount (kobo), currency, ... }
}
