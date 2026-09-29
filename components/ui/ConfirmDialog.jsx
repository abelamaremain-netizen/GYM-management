'use client';

import { X } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`button ${danger ? 'button-danger' : 'button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
