'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '../supabase';
import { createSession, revokeSession, SESSION_COOKIE } from '../auth';
import { verifyPassword, writeAuditLog } from '../utils';

export async function loginAction(prevState, formData) {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (!supabaseAdmin) {
    // Demo mode — only when NEXT_PUBLIC_DEMO_MODE=true and no real database is configured.
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const DEMO_EMAIL = 'admin@demo.com';
      const DEMO_PASSWORD = 'demo1234';
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, 'demo-session-token', {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 8 * 60 * 60,
          path: '/',
        });
        redirect('/dashboard');
      }
      return { error: 'Demo mode: use admin@demo.com / demo1234 to preview the UI.' };
    }
    return { error: 'Database not configured. Add Supabase environment variables to .env.local.' };
  }

  // Fetch admin user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, status, password_hash')
    .eq('email', email)
    .in('role', ['super_admin', 'admin'])
    .single();

  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  if (user.status === 'deleted') {
    return { error: 'This account has been deactivated.' };
  }

  if (!user.password_hash) {
    return { error: 'Account not configured for login.' };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: 'Invalid email or password.' };
  }

  // Get session duration from configurations
  const { data: config } = await supabaseAdmin
    .from('configurations')
    .select('value')
    .eq('key', 'admin_session_duration_hours')
    .single();

  const sessionHours = config ? parseInt(config.value, 10) : 8;
  const token = await createSession(user.id, sessionHours);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionHours * 60 * 60,
    path: '/',
  });

  await writeAuditLog(supabaseAdmin, {
    action: 'admin_login',
    entityType: 'user',
    entityId: user.id,
    performedBy: user.id,
    newValue: { email: user.email, role: user.role },
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  await revokeSession();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/login');
}
