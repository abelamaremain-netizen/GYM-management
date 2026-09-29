'use client';

import { useState, useActionState } from 'react';
import { X, Loader2, Pencil } from 'lucide-react';
import { updateEquipmentAction, changeEquipmentStatusAction, markServicedAction, restoreEquipmentAction } from '../../lib/actions/equipment';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRouter } from 'next/navigation';

export default function EquipmentActions({ equipment, categories }) {
  const router = useRouter();
  const [modal, setModal] = useState(null);

  const [editState, editAction, editPending] = useActionState(async (prev, formData) => {
    const result = await updateEquipmentAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [statusState, statusAction, statusPending] = useActionState(async (prev, formData) => {
    const result = await changeEquipmentStatusAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [serviceState, serviceAction, servicePending] = useActionState(async (prev, formData) => {
    const result = await markServicedAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const isRetired = equipment.status === 'retired';

  return (
    <>
      <div className="action-btn-row">
        {!isRetired && (
          <>
            <button className="button button-quiet" onClick={() => setModal('edit')}><Pencil size={13} /> Edit</button>
            <button className="button button-quiet" onClick={() => setModal('status')}>Change status</button>
            {equipment.status !== 'operational' && (
              <button className="button button-primary" onClick={() => setModal('service')}>Mark serviced</button>
            )}
          </>
        )}
        {isRetired && (
          <button className="button button-quiet" onClick={async () => { await restoreEquipmentAction(equipment.id); router.refresh(); }}>Restore</button>
        )}
      </div>

      {modal === 'edit' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={editAction}>
            <input type="hidden" name="id" value={equipment.id} />
            <div className="modal-heading"><h2>Edit equipment</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {editState?.error && <div className="auth-error">{editState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Name <input name="name" defaultValue={equipment.name} className="form-input" required /></label>
              <label className="form-label">Category
                <select name="category" defaultValue={equipment.category} className="form-input" required>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="form-label">Serial number <input name="serial_number" defaultValue={equipment.serial_number} className="form-input" /></label>
              <label className="form-label">Purchase date <input name="purchase_date" type="date" defaultValue={equipment.purchase_date} className="form-input" /></label>
              <label className="form-label wide-field">Notes <textarea name="notes" defaultValue={equipment.notes} className="form-input form-textarea" /></label>
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

      {modal === 'status' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={statusAction}>
            <input type="hidden" name="id" value={equipment.id} />
            <div className="modal-heading"><h2>Change status</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {statusState?.error && <div className="auth-error">{statusState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">New status
                <select name="status" defaultValue={equipment.status} className="form-input" required>
                  <option value="operational">Operational</option>
                  <option value="needs_service">Needs service</option>
                  <option value="out_of_order">Out of order</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label className="form-label wide-field">Notes <input name="notes" className="form-input" placeholder="Reason for status change" /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={statusPending}>
                {statusPending ? <><Loader2 size={15} className="spin" /> Updating…</> : 'Update status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'service' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={serviceAction}>
            <input type="hidden" name="id" value={equipment.id} />
            <div className="modal-heading"><h2>Mark as serviced</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {serviceState?.error && <div className="auth-error">{serviceState.error}</div>}
            <div className="form-grid">
              <label className="form-label wide-field">Service notes <textarea name="notes" className="form-input form-textarea" placeholder="What was serviced or repaired..." /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={servicePending}>
                {servicePending ? <><Loader2 size={15} className="spin" /> Saving…</> : 'Mark serviced'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
