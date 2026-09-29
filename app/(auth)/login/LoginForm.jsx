'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginForm({ action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="auth-form">
      {state?.error && (
        <div className="auth-error" role="alert">{state.error}</div>
      )}

      <label className="form-label">
        Email address
        <input
          name="email"
          type="email"
          className="form-input"
          placeholder="admin@gym.com"
          required
          autoComplete="email"
          autoFocus
        />
      </label>

      <label className="form-label">
        Password
        <div className="input-with-action">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="input-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        className="button button-primary auth-submit"
        disabled={pending}
      >
        {pending ? <><Loader2 size={16} className="spin" /> Signing in…</> : 'Sign in'}
      </button>
    </form>
  );
}
