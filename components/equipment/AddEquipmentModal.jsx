'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createEquipmentAction } from '../../lib/actions/equipment';
import { useRouter } from 'next/navigation';

export default function AddEquipmentModal({ categories }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createEquipmentAction(prev, formData);
    if (result?.success) { setOpen(false); router.refresh(); }
    return result;
  }, null);

  return (
    <>
      <button className="button button-primary" onClick={() => setOpen(true)}><Plus size={17} /> Add equipment</button>

      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" action={formAction}>
            <div className="modal-heading">
              <div><span className="eyebrow">EQUIPMENT</span><h2>Add equipment</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {state?.error && <div className="auth-error">{state.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Name <input name="name" className="form-input" placeholder="e.g. Treadmill 1" required /></label>
              <label className="form-label">Category
                <select name="category" className="form-input" required>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="form-label">Serial number <input name="serial_number" className="form-input" placeholder="Optional" /></label>
              <label className="form-label">Purchase date <input name="purchase_date" type="date" className="form-input" /></label>
              <label className="form-label wide-field">Notes <textarea name="notes" className="form-input form-textarea" placeholder="Any additional notes..." /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={pending}>
                {pending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Add equipment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
