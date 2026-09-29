import { supabaseAdmin } from '../../../lib/supabase';
import { generateNotificationsAction } from '../../../lib/actions/notifications';
import { formatDate } from '../../../lib/utils';
import PageHeader from '../../../components/ui/PageHeader';
import { Bell } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import NotificationItem from '../../../components/notifications/NotificationItem';
import Link from 'next/link';

async function getNotifications(filter) {
  if (!supabaseAdmin) return [];
  await generateNotificationsAction();

  let query = supabaseAdmin
    .from('notifications')
    .select('*, users!dismissed_by(name)')
    .order('generated_at', { ascending: false });

  if (filter === 'active') query = query.in('status', ['active', 'seen']);
  else if (filter === 'dismissed') query = query.eq('status', 'dismissed');
  else if (filter === 'resolved') query = query.eq('status', 'resolved');
  else query = query.not('status', 'eq', 'resolved');

  const { data } = await query;
  return data || [];
}

const TYPE_LABELS = {
  membership_expiring: 'Membership Expiring',
  membership_expired: 'Membership Expired',
  payment_overdue: 'Payment Overdue',
  freeze_ending: 'Freeze Ending',
  equipment_service_due: 'Service Due',
  equipment_out_of_order: 'Out of Order',
};

export default async function NotificationsPage({ searchParams }) {
  const filter = searchParams?.filter || 'active';
  const notifications = await getNotifications(filter);

  const grouped = notifications.reduce((acc, n) => {
    const key = TYPE_LABELS[n.type] || n.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <>
      <PageHeader eyebrow="ALERTS" title="Notifications" description="System-generated alerts that require your attention." />

      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {[['active', 'Active'], ['dismissed', 'Dismissed'], ['resolved', 'Resolved'], ['all', 'All']].map(([val, label]) => (
          <Link key={val} href={`/notifications?filter=${val}`} className={`tab-item ${filter === val ? 'tab-active' : ''}`}>{label}</Link>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="panel page-panel">
          <EmptyState icon={Bell} title="No notifications" description="Everything looks good." />
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <section key={group} className="panel page-panel" style={{ marginBottom: 14 }}>
            <div className="panel-heading">
              <div><span className="eyebrow">{group.toUpperCase()}</span><h2>{group}</h2></div>
              <span className="result-count">{items.length}</span>
            </div>
            <div className="notification-list">
              {items.map((n) => <NotificationItem key={n.id} notification={n} />)}
            </div>
          </section>
        ))
      )}
    </>
  );
}
