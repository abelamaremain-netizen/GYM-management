import { loginAction } from '../../../lib/actions/auth';
import LoginForm from './LoginForm';
import { Dumbbell } from 'lucide-react';

export const metadata = { title: 'Sign in — Gym Management' };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const from = params?.from || '/dashboard';
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Dumbbell size={22} /></span>
          <span className="auth-brand-name">GYM<span className="brand-period">.</span></span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your admin account</p>
        {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <div style={{ background: '#edf5ed', border: '1px solid #c5e4cc', borderRadius: 5, padding: '10px 13px', marginBottom: 16, fontSize: 11, color: '#305c3b' }}>
            <strong>Demo mode</strong> — use <code>admin@demo.com</code> / <code>demo1234</code>
          </div>
        )}
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
