'use client';

import { useState, useActionState } from 'react';
import { X, Loader2, Pencil } from 'lucide-react';
import { updateMemberAction, freezeMemberAction, unfreezeMemberAction, deleteMemberAction, restoreMemberAction } from '../../lib/actions/members';
import { markPaymentAction, setGracePeriodAction } from '../../lib/actions/memberships';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useToast } from '../ui/Toast';

export default function MemberActions({ member, activeMembership }) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState(null); // 'edit' | 'freeze' | 'grace' | 'confirm-delete' | 'confirm-unfreeze' | 'confirm-restore'

  const [editState, editAction, editPending] = useActionState(async (prev, formData) => {
    const result = await updateMemberAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [freezeState, freezeAction, freezePending] = useActionState(async (prev, formData) => {
    const result = await freezeMemberAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [graceState, graceAction, gracePending] = useActionState(async (prev, formData) => {
    const result = await setGracePeriodAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const profile = member.member_profiles?.[0];
  const isDeleted = member.status === 'deleted';
  const isFrozen = member.status === 'frozen';

  return (
    <>
      <div className="action-btn-row">
        {!isDeleted && (
          <>
            <button className="button button-quiet" onClick={() => setModal('edit')}><Pencil size={14} /> Edit</button>
            {!isFrozen && <button className="button button-quiet" onClick={() => setModal('freeze')}>Freeze</button>}
            {isFrozen && <button className="button button-quiet" onClick={() => setModal('confirm-unfreeze')}>Unfreeze</button>}
            {activeMembership && !activeMembership.paid && (
              <button className="button button-primary" onClick={async () => {
                const result = await markPaymentAction(activeMembership.id, true, member.id);
                if (result?.error) toast(result.error, 'error');
                else { toast('Payment marked as paid.'); router.refresh(); }
              }}>Mark paid</button>
            )}
            {activeMembership?.paid && (
              <button className="button button-quiet" onClick={async () => {
                const result = await markPaymentAction(activeMembership.id, false, member.id);
                if (result?.error) toast(result.error, 'error');
                else { toast('Payment marked as unpaid.'); router.refresh(); }
              }}>Mark unpaid</button>
            )}
            {member.status === 'expired' && (
              <button className="button button-quiet" onClick={() => setModal('grace')}>Set grace</button>
            )}
            <button className="button button-danger" onClick={() => setModal('confirm-delete')}>Delete</button>
          </>
        )}
        {isDeleted && (
          <button className="button button-primary" onClick={() => setModal('confirm-restore')}>Restore</button>
        )}
      </div>

      {/* Edit modal */}
      {modal === 'edit' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={editAction}>
            <input type="hidden" name="id" value={member.id} />
            <div className="modal-heading">
              <h2>Edit member</h2>
              <button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {editState?.error && <div className="auth-error">{editState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Full name <input name="name" defaultValue={member.name} className="form-input" required /></label>
              <label className="form-label">Email <input name="email" type="email" defaultValue={member.email} className="form-input" /></label>
              <label className="form-label">Phone <input name="phone" defaultValue={member.phone} className="form-input" /></label>
              <label className="form-label">Date of birth <input name="date_of_birth" type="date" defaultValue={profile?.date_of_birth} className="form-input" /></label>
              <label className="form-label">Gender
                <select name="gender" defaultValue={profile?.gender || ''} className="form-input">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="form-label">Emergency contact name <input name="emergency_contact_name" defaultValue={profile?.emergency_contact_name} className="form-input" /></label>
              <label className="form-label">Emergency contact phone <input name="emergency_contact_phone" defaultValue={profile?.emergency_contact_phone} className="form-input" /></label>
              <label className="form-label wide-field">Health notes <textarea name="health_notes" defaultValue={profile?.health_notes} className="form-input form-textarea" /></label>
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

      {/* Freeze modal */}
      {modal === 'freeze' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={freezeAction}>
            <input type="hidden" name="member_id" value={member.id} />
            <div className="modal-heading">
              <h2>Freeze membership</h2>
              <button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {freezeState?.error && <div className="auth-error">{freezeState.error}</div>}
            <div className="form-grid">
              <label className="form-label">Freeze start <input name="freeze_start" type="date" className="form-input" required /></label>
              <label className="form-label">Freeze end <input name="freeze_end" type="date" className="form-input" required /></label>
              <label className="form-label wide-field">Reason <input name="reason" className="form-input" placeholder="Travel, injury, etc." /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={freezePending}>
                {freezePending ? <><Loader2 size={15} className="spin" /> Freezing…</> : 'Freeze membership'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grace period modal */}
      {modal === 'grace' && activeMembership && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={graceAction}>
            <input type="hidden" name="membership_id" value={activeMembership.id} />
            <div className="modal-heading">
              <h2>Set grace period</h2>
              <button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {graceState?.error && <div className="auth-error">{graceState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Grace until <input name="grace_until" type="date" className="form-input" required /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={gracePending}>
                {gracePending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Set grace period'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'confirm-unfreeze' && (
        <ConfirmDialog
          title="Unfreeze membership"
          message={`Reactivate ${member.name}'s membership? Unused freeze days will be removed from the end date.`}
          confirmLabel="Unfreeze"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const result = await unfreezeMemberAction(member.id);
            setModal(null);
            if (result?.error) toast(result.error, 'error');
            else { toast(`${member.name} has been unfrozen.`); router.refresh(); }
          }}
        />
      )}

      {modal === 'confirm-delete' && (
        <ConfirmDialog
          title="Delete member"
          message={`Soft-delete ${member.name}? Their data will be preserved and can be restored.`}
          confirmLabel="Delete"
          danger
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const result = await deleteMemberAction(member.id);
            setModal(null);
            if (result?.error) toast(result.error, 'error');
            else { toast(`${member.name} has been deleted.`); router.push('/members'); }
          }}
        />
      )}

      {modal === 'confirm-restore' && (
        <ConfirmDialog
          title="Restore member"
          message={`Restore ${member.name}?`}
          confirmLabel="Restore"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const result = await restoreMemberAction(member.id);
            setModal(null);
            if (result?.error) toast(result.error, 'error');
            else { toast(`${member.name} has been restored.`); router.refresh(); }
          }}
        />
      )}
    </>
  );
}
