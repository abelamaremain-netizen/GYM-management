'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createMemberAction } from '../../lib/actions/members';
import { useRouter } from 'next/navigation';

export default function AddMemberModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createMemberAction(prev, formData);
    if (result?.success) {
      setOpen(false);
      router.refresh();
    }
    return result;
  }, null);

  return (
    <>
      <button className="button button-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> Add member
      </button>

      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" action={formAction}>
            <div className="modal-heading">
              <div><span className="eyebrow">MEMBERS</span><h2>Add new member</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            {state?.error && <div className="auth-error">{state.error}</div>}

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
