'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createMemberAction } from '../../lib/actions/members';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function AddMemberModal({ plans = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const router = useRouter();

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;
  const today = new Date().toISOString().slice(0, 10);

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createMemberAction(prev, formData);
    if (result?.success) {
      setOpen(false);
      setSelectedPlanId('');
      router.refresh();
    }
    return result;
  }, null);

  function handleOpen() {
    setSelectedPlanId('');
    setOpen(true);
  }

  return (
    <>
      <button className="button button-primary" onClick={handleOpen}>
        <Plus size={17} /> Add member
      </button>

      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal modal-lg" action={formAction}>
            <div className="modal-heading">
              <div><span className="eyebrow">MEMBERS</span><h2>Add new member</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            {state?.error && <div className="auth-error">{state.error}</div>}

            {/* ── Identity ── */}
            <div className="form-section-label">Personal details</div>
            <div className="form-grid">
              <label className="form-label wide-field">Full name <input name="name" className="form-input" placeholder="e.g. Abebe Bekele" required /></label>
              <label className="form-label">Email <input name="email" type="email" className="form-input" placeholder="abebe@email.com" /></label>
              <label className="form-label">Phone <input name="phone" className="form-input" placeholder="+251 9xx xxx xxx" /></label>
              <label className="form-label">Date of birth <input name="date_of_birth" type="date" className="form-input" /></label>
              <label className="form-label">Gender
                <select name="gender" className="form-input">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="form-label">Emergency contact name <input name="emergency_contact_name" className="form-input" placeholder="Contact name" /></label>
              <label className="form-label">Emergency contact phone <input name="emergency_contact_phone" className="form-input" placeholder="+251 9xx xxx xxx" /></label>
              <label className="form-label wide-field">Health notes <textarea name="health_notes" className="form-input form-textarea" placeholder="Any known conditions, injuries, or notes..." /></label>
            </div>

            {/* ── Membership plan ── */}
            <div className="form-section-divider" />
            <div className="form-section-label">Membership plan <span className="form-section-optional">(optional — can be assigned later)</span></div>
            <div className="form-grid">
              <label className="form-label wide-field">
                Plan
                <select
                  name="plan_id"
                  className="form-input"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">No plan — assign later</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.duration_days} days — {formatCurrency(p.final_price)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedPlan && (
                <>
                  <label className="form-label">
                    Start date
                    <input name="start_date" type="date" defaultValue={today} className="form-input" required />
                  </label>
                  <label className="form-label">
                    Payment
                    <select name="paid" className="form-input" defaultValue="false">
                      <option value="false">Unpaid — collect later</option>
                      <option value="true">Paid now</option>
                    </select>
                  </label>
                  <div className="form-label wide-field plan-summary">
                    <div className="plan-summary-row">
                      <span>Plan</span><strong>{selectedPlan.name}</strong>
                    </div>
                    <div className="plan-summary-row">
                      <span>Duration</span><strong>{selectedPlan.duration_days} days</strong>
                    </div>
                    {selectedPlan.discount_amount > 0 && (
                      <div className="plan-summary-row">
                        <span>Discount</span><strong>- {formatCurrency(selectedPlan.discount_amount)}</strong>
                      </div>
                    )}
                    <div className="plan-summary-row plan-summary-total">
                      <span>Total</span><strong>{formatCurrency(selectedPlan.final_price)}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={pending}>
                {pending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Add member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
