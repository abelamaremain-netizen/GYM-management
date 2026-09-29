import { loginAction } from '../../../lib/actions/auth';
import LoginForm from './LoginForm';
import { Dumbbell } from 'lucide-react';

export const metadata = { title: 'Sign in — Gym Management' };

export default function LoginPage({ searchParams }) {
  const from = searchParams?.from || '/dashboard';
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Dumbbell size={22} /></span>
          <span className="auth-brand-name">GYM<span className="brand-period">.</span></span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your admin account</p>
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
