'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

// Task 13: Added loading/disabled state on confirm button
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} disabled={loading} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="button button-quiet" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            type="button"
            className={`button ${danger ? 'button-danger' : 'button-primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <><Loader2 size={14} className="spin" /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
