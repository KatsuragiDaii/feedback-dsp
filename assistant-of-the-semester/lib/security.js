import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
const COOKIE = 'aots_admin';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePin() {
  return Array.from({length: 10}, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
export function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pin, salt, 32, {N:2048,r:8,p:1}).toString('hex')}`;
}
export function verifyPin(pin, stored) {
  try {
    const [salt, hex] = stored.split(':');
    if (!salt || !hex) return false;
    const actual = scryptSync(pin, salt, 32, {N:2048,r:8,p:1});
    const expected = Buffer.from(hex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
export function passwordIsValid(given) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12 || typeof given !== 'string') return false;
  return timingSafeEqual(
    createHash('sha256').update(given).digest(),
    createHash('sha256').update(expected).digest()
  );
}
function sessionSignature(expires) {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  if (secret.length < 32) return '';
  return createHmac('sha256', secret).update(`admin:${expires}`).digest('hex');
}
export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value || '';
  const [expires, signature] = value.split('.');
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) <= Date.now()) return false;
  const valid = sessionSignature(expires);
  if (!valid || signature.length !== valid.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(valid));
}
export async function setAdminCookie() {
  const expires = String(Date.now() + 24 * 60 * 60 * 1000);
  const signature = sessionSignature(expires);
  if (!signature) throw new Error('ADMIN_SESSION_SECRET harus minimal 32 karakter.');
  (await cookies()).set(COOKIE, `${expires}.${signature}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 24 * 60 * 60
  });
}
export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
export function validOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
