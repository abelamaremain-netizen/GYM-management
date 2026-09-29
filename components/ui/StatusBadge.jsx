export default function StatusBadge({ status }) {
  const map = {
    active:       { label: 'Active',       cls: 'status-active'   },
    frozen:       { label: 'Frozen',       cls: 'status-frozen'   },
    expired:      { label: 'Expired',      cls: 'status-expired'  },
    deleted:      { label: 'Deleted',      cls: 'status-deleted'  },
    operational:  { label: 'Operational',  cls: 'status-active'   },
    needs_service:{ label: 'Needs Service',cls: 'status-frozen'   },
    out_of_order: { label: 'Out of Order', cls: 'status-expired'  },
    retired:      { label: 'Retired',      cls: 'status-deleted'  },
    paid:         { label: 'Paid',         cls: 'status-active'   },
    unpaid:       { label: 'Unpaid',       cls: 'status-expired'  },
  };
  const entry = map[status] ?? { label: status, cls: '' };
  return (
    <span className={`status-pill ${entry.cls}`}>
      <i />
      {entry.label}
    </span>
  );
}
