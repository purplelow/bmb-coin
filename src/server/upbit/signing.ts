/**
 * Upbit JWT signing — SERVER ONLY.
 *
 * Never import this from client code: it reads the secret key from server env
 * and signs requests. The browser talks to our own /api/upbit/* routes, which
 * call this. The secret key never enters the client bundle.
 *
 * Upbit auth: a JWT (HS256) in the `Authorization: Bearer <token>` header.
 *   payload = { access_key, nonce, [query_hash, query_hash_alg] }
 * For endpoints with parameters, query_hash = SHA512(querystring) in hex.
 */

import crypto from 'node:crypto';

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** True only when both Upbit keys are present in the server env. */
export function hasUpbitKeys(): boolean {
  return Boolean(process.env.UPBIT_ACCESS_KEY && process.env.UPBIT_SECRET_KEY);
}

/**
 * Build a signed Upbit JWT. Pass `params` for authenticated endpoints that take
 * query/body parameters (e.g. POST /v1/orders) so a query_hash is included.
 */
export function createUpbitToken(params?: Record<string, string | number>): string {
  const accessKey = process.env.UPBIT_ACCESS_KEY;
  const secretKey = process.env.UPBIT_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error('Upbit API keys are not configured on the server.');
  }

  const payload: Record<string, unknown> = {
    access_key: accessKey,
    nonce: crypto.randomUUID(),
  };

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    payload.query_hash = crypto.createHash('sha512').update(query, 'utf8').digest('hex');
    payload.query_hash_alg = 'SHA512';
  }

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = base64url(crypto.createHmac('sha256', secretKey).update(signingInput).digest());

  return `${signingInput}.${signature}`;
}
