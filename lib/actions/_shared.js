'use server';

import { getSession } from '../auth';

/**
 * Asserts the current request has a valid admin session.
 * Returns the session object on success.
 * Throws an error if not authenticated — server action will return 500.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

/**
 * Asserts the current request has a super_admin session.
 * Use for configuration changes and destructive operations.
 */
export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (session.role !== 'super_admin') throw new Error('Super admin access required.');
  return session;
}
