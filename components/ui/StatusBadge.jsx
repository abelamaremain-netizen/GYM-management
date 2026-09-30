export default function StatusBadge({ status }) {
  const map = {
    // Member statuses
    active:        { label: 'Active',        cls: 'status-active'        },
    frozen:        { label: 'Frozen',        cls: 'status-frozen'        },
    expired:       { label: 'Expired',       cls: 'status-expired'       },
    deleted:       { label: 'Deleted',       cls: 'status-deleted'       },
    // Equipment statuses — own semantic names, not reusing member classes
    operational:   { label: 'Operational',   cls: 'status-operational'   },
    needs_service: { label: 'Needs Service', cls: 'status-needs-service' },
    out_of_order:  { label: 'Out of Order',  cls: 'status-out-of-order'  },
    retired:       { label: 'Retired',       cls: 'status-retired'       },
    // Payment statuses
    paid:          { label: 'Paid',          cls: 'status-active'        },
    unpaid:        { label: 'Unpaid',        cls: 'status-expired'       },
  };
  const entry = map[status] ?? { label: status ?? '—', cls: '' };
  return (
    <span className={`status-pill ${entry.cls}`}>
      <i />
      {entry.label}
    </span>
  );
}
