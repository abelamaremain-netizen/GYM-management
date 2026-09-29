'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { assignMembershipAction } from '../../lib/actions/memberships';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function AssignMembershipModal({ memberId, plans }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await assignMembershipAction(prev, formData);
    if (result?.success) { setOpen(false); router.refresh(); }
    return result;
  }, null);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button className="button button-quiet" onClick={() => setOpen(true)}><Plus size={14} /> Assign plan</button>

      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" action={formAction}>
            <input type="hidden" name="member_id" value={memberId} />
            <div className="modal-heading">
              <h2>Assign membership plan</h2>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {state?.error && <div className="auth-error">{state.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Plan
                <select name="plan_id" className="form-input" required>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.duration_days} days — {formatCurrency(p.final_price)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">Start date <input name="start_date" type="date" defaultValue={today} className="form-input" required /></label>
              <label className="form-label wide-field">Notes <input name="notes" className="form-input" placeholder="Optional notes" /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={pending}>
                {pending ? <><Loader2 size={15} className="spin" /> Assigning…</> : 'Assign plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
