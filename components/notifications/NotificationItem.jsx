'use client';

import { dismissNotificationAction, resolveNotificationAction } from '../../lib/actions/notifications';
import { useRouter } from 'next/navigation';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCircle, X } from 'lucide-react';

const TYPE_COLORS = {
  membership_expiring:    'notif-yellow',
  membership_expired:     'notif-red',
  payment_overdue:        'notif-red',
  freeze_ending:          'notif-blue',
  equipment_service_due:  'notif-yellow',
  equipment_out_of_order: 'notif-red',
};

export default function NotificationItem({ notification: n }) {
  const router = useRouter();
  const colorClass = TYPE_COLORS[n.type] || 'notif-blue';
  const isActive = n.status === 'active' || n.status === 'seen';

  return (
    <div className={`notification-row ${colorClass}`}>
      <span className="notif-icon"><Bell size={15} /></span>
      <div className="notif-body">
        <span className="notif-message">{n.message}</span>
        <small className="notif-time">{formatDate(n.generated_at)}</small>
      </div>
      <div className="notif-actions">
        {isActive && (
          <>
            <button
              className="button button-quiet"
              onClick={async () => { await resolveNotificationAction(n.id); router.refresh(); }}
              title="Mark resolved"
            >
              <CheckCircle size={14} /> Resolve
            </button>
            <button
              className="button button-quiet"
              onClick={async () => { await dismissNotificationAction(n.id); router.refresh(); }}
              title="Dismiss"
            >
              <X size={14} /> Dismiss
            </button>
          </>
        )}
        {n.status === 'dismissed' && (
          <span className="muted-cell" style={{ fontSize: 10 }}>Dismissed by {n.users?.name || 'admin'}</span>
        )}
        {n.status === 'resolved' && (
          <span className="status-pill status-active" style={{ fontSize: 9 }}><i />Resolved</span>
        )}
      </div>
    </div>
  );
}
