import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

const SESSION_COOKIE = 'gym_session';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Hash a token for safe storage in the database.
 * Uses Web Crypto API available in Next.js edge/server context.
 */
export async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically random session token.
 */
export function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Session management ────────────────────────────────────────

/**
 * Create a new session for an admin user.
 * Returns the plain token to be stored in a cookie.
 */
export async function createSession(adminId, sessionHours = 8) {
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);

  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .insert({ admin_id: adminId, token_hash: tokenHash, expires_at: expiresAt.toISOString() });

  if (error) throw new Error('Failed to create session');
  return token;
}

/**
 * Validate the session token from the cookie.
 * Returns the admin user object or null.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();

  const { data: session } = await supabaseAdmin
    .from('admin_sessions')
    .select('admin_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!session) return null;
  if (session.revoked_at) return null;
  if (session.expires_at < now) return null;

  const { data: admin } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, status')
    .eq('id', session.admin_id)
    .in('role', ['super_admin', 'admin'])
    .eq('status', 'active')
    .single();

  return admin || null;
}

/**
 * Revoke a session (logout).
 */
export async function revokeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenHash = await hashToken(token);
  await supabaseAdmin
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);
}

export { SESSION_COOKIE };
