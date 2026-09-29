'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createInstructorAction } from '../../lib/actions/instructors';
import { useRouter } from 'next/navigation';

export default function AddInstructorModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createInstructorAction(prev, formData);
    if (result?.success) { setOpen(false); router.refresh(); }
    return result;
  }, null);

  return (
    <>
      <button className="button button-primary" onClick={() => setOpen(true)}><Plus size={17} /> Add instructor</button>

      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" action={formAction}>
            <div className="modal-heading">
              <div><span className="eyebrow">STAFF</span><h2>Add instructor</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {state?.error && <div className="auth-error">{state.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Full name <input name="name" className="form-input" placeholder="e.g. Kebede Alemu" required /></label>
              <label className="form-label">Email <input name="email" type="email" className="form-input" placeholder="kebede@gym.com" required /></label>
              <label className="form-label">Phone <input name="phone" className="form-input" placeholder="+251 9xx xxx xxx" /></label>
              <label className="form-label">Specialization <input name="specialization" className="form-input" placeholder="Strength, Cardio, etc." /></label>
              <label className="form-label">Hourly rate <input name="hourly_rate" type="number" step="0.01" min="0" className="form-input" placeholder="0.00" /></label>
              <label className="form-label">Contract type
                <select name="contract_type" className="form-input">
                  <option value="">Select</option>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="freelance">Freelance</option>
                </select>
              </label>
              <label className="form-label">Joined staff date <input name="joined_staff_at" type="date" className="form-input" /></label>
              <label className="form-label">Initial password <input name="password" type="password" className="form-input" placeholder="Min 8 characters" required /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={pending}>
                {pending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Add instructor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
