'use client';

import { useState, useActionState } from 'react';
import { X, Loader2, Pencil } from 'lucide-react';
import { updateInstructorAction, resetInstructorPasswordAction, deleteInstructorAction, restoreInstructorAction } from '../../lib/actions/instructors';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRouter } from 'next/navigation';

export default function InstructorActions({ instructor, profile }) {
  const router = useRouter();
  const [modal, setModal] = useState(null);

  const [editState, editAction, editPending] = useActionState(async (prev, formData) => {
    const result = await updateInstructorAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [pwState, pwAction, pwPending] = useActionState(async (prev, formData) => {
    const result = await resetInstructorPasswordAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const isDeleted = instructor.status === 'deleted';

  return (
    <>
      <div className="action-btn-row">
        {!isDeleted && (
          <>
            <button className="button button-quiet" onClick={() => setModal('edit')}><Pencil size={13} /> Edit</button>
            <button className="button button-quiet" onClick={() => setModal('password')}>Reset password</button>
            <button className="button button-danger" onClick={() => setModal('confirm-delete')}>Delete</button>
          </>
        )}
        {isDeleted && (
          <button className="button button-primary" onClick={() => setModal('confirm-restore')}>Restore</button>
        )}
      </div>

      {modal === 'edit' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={editAction}>
            <input type="hidden" name="id" value={instructor.id} />
            <div className="modal-heading"><h2>Edit instructor</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {editState?.error && <div className="auth-error">{editState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Full name <input name="name" defaultValue={instructor.name} className="form-input" required /></label>
              <label className="form-label">Email <input name="email" type="email" defaultValue={instructor.email} className="form-input" required /></label>
              <label className="form-label">Phone <input name="phone" defaultValue={instructor.phone} className="form-input" /></label>
              <label className="form-label">Specialization <input name="specialization" defaultValue={profile?.specialization} className="form-input" /></label>
              <label className="form-label">Hourly rate <input name="hourly_rate" type="number" step="0.01" min="0" defaultValue={profile?.hourly_rate} className="form-input" /></label>
              <label className="form-label">Contract type
                <select name="contract_type" defaultValue={profile?.contract_type || ''} className="form-input">
                  <option value="">Select</option>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="freelance">Freelance</option>
                </select>
              </label>
              <label className="form-label">Joined staff date <input name="joined_staff_at" type="date" defaultValue={profile?.joined_staff_at} className="form-input" /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={editPending}>
                {editPending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'password' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={pwAction}>
            <input type="hidden" name="id" value={instructor.id} />
            <div className="modal-heading"><h2>Reset password</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {pwState?.error && <div className="auth-error">{pwState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">New password <input name="new_password" type="password" className="form-input" placeholder="Min 8 characters" required /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={pwPending}>
                {pwPending ? <><Loader2 size={15} className="spin" /> Resetting…</> : 'Reset password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'confirm-delete' && (
        <ConfirmDialog title="Delete instructor" message={`Delete ${instructor.name}? Their data and history will be preserved.`} confirmLabel="Delete" danger onClose={() => setModal(null)} onConfirm={async () => { await deleteInstructorAction(instructor.id); setModal(null); router.refresh(); }} />
      )}
      {modal === 'confirm-restore' && (
        <ConfirmDialog title="Restore instructor" message={`Restore ${instructor.name}?`} confirmLabel="Restore" onClose={() => setModal(null)} onConfirm={async () => { await restoreInstructorAction(instructor.id); setModal(null); router.refresh(); }} />
      )}
    </>
  );
}
