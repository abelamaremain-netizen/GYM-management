'use client';

import { useState, useActionState } from 'react';
import { Plus, X, Loader2, Pencil } from 'lucide-react';
import { createPlanAction, updatePlanAction, togglePlanAction } from '../../lib/actions/memberships';
import { formatCurrency } from '../../lib/utils';
import { useRouter } from 'next/navigation';

function PlanForm({ plan, action, pending, state, onClose }) {
  return (
    <>
      {state?.error && <div className="auth-error">{state.error}</div>}
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div className="form-grid">
        <label className="form-label wide-field">Plan name <input name="name" defaultValue={plan?.name} className="form-input" placeholder="e.g. Monthly" required /></label>
        <label className="form-label">Duration (days) <input name="duration_days" type="number" min="1" defaultValue={plan?.duration_days} className="form-input" placeholder="30" required /></label>
        <label className="form-label">Original price <input name="original_price" type="number" step="0.01" min="0" defaultValue={plan?.original_price} className="form-input" placeholder="500.00" required /></label>
        <label className="form-label">Discount amount <input name="discount_amount" type="number" step="0.01" min="0" defaultValue={plan?.discount_amount ?? 0} className="form-input" placeholder="0.00" /></label>
      </div>
      <div className="modal-actions">
        <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? <><Loader2 size={15} className="spin" /> Saving…</> : plan ? 'Save changes' : 'Create plan'}
        </button>
      </div>
    </>
  );
}

export default function ManagePlansSection({ plans }) {
  const router = useRouter();
  const [modal, setModal] = useState(null); // null | 'create' | plan object
  const activePlans = plans.filter((p) => p.is_active);
  const inactivePlans = plans.filter((p) => !p.is_active);

  const [createState, createAction, createPending] = useActionState(async (prev, formData) => {
    const result = await createPlanAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  const [editState, editAction, editPending] = useActionState(async (prev, formData) => {
    const result = await updatePlanAction(prev, formData);
    if (result?.success) { setModal(null); router.refresh(); }
    return result;
  }, null);

  return (
    <section className="panel page-panel">
      <div className="panel-heading list-heading">
        <div><span className="eyebrow">PLANS</span><h2>Membership plans</h2></div>
        <button className="button button-primary" onClick={() => setModal('create')}><Plus size={16} /> New plan</button>
      </div>

      <div className="plans-grid">
        {plans.length === 0 && <p className="panel-empty">No plans yet. Create your first plan.</p>}
        {plans.map((plan) => (
          <article key={plan.id} className={`plan-card ${!plan.is_active ? 'plan-inactive' : ''}`}>
            <div className="plan-card-header">
              <div>
                <span className="eyebrow">PLAN · {plan.duration_days} DAYS</span>
                <h3>{plan.name}</h3>
              </div>
              <button className="icon-button" onClick={() => setModal(plan)} aria-label="Edit plan"><Pencil size={14} /></button>
            </div>
            <div className="plan-price-row">
              {plan.discount_amount > 0 && <span className="plan-original">{formatCurrency(plan.original_price)}</span>}
              <strong className="plan-final">{formatCurrency(plan.final_price)}</strong>
            </div>
            {plan.discount_amount > 0 && <span className="plan-discount">Discount: {formatCurrency(plan.discount_amount)}</span>}
            <div className="plan-card-footer">
              <span className={`status-pill ${plan.is_active ? 'status-active' : 'status-deleted'}`}><i />{plan.is_active ? 'Active' : 'Inactive'}</span>
              <button
                className="button button-quiet"
                onClick={async () => { await togglePlanAction(plan.id, !plan.is_active); router.refresh(); }}
              >
                {plan.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={createAction}>
            <div className="modal-heading"><h2>Create plan</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            <PlanForm action={createAction} pending={createPending} state={createState} onClose={() => setModal(null)} />
          </form>
        </div>
      )}

      {/* Edit modal */}
      {modal && modal !== 'create' && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="modal" action={editAction}>
            <div className="modal-heading"><h2>Edit plan</h2><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={18} /></button></div>
            <PlanForm plan={modal} action={editAction} pending={editPending} state={editState} onClose={() => setModal(null)} />
          </form>
        </div>
      )}
    </section>
  );
}
