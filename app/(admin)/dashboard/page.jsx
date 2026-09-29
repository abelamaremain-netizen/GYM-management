import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import { generateNotificationsAction } from '../../../lib/actions/notifications';
import { formatCurrency, daysUntil, formatDate } from '../../../lib/utils';
import {
  Users, ShieldCheck, Wallet, Bell, AlertTriangle,
  Snowflake, TrendingUp, Wrench,
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '../../../components/ui/StatusBadge';

async function getDashboardData() {
  if (!supabaseAdmin) return null;

  await generateNotificationsAction();

  const today = new Date().toISOString().slice(0, 10);
  const warningDate = new Date();

  // Get config values
  const { data: configs } = await supabaseAdmin
    .from('configurations')
    .select('key, value')
    .in('key', ['membership_expiry_warning_days', 'payment_due_warning_days']);
  const cfg = Object.fromEntries((configs || []).map((c) => [c.key, parseInt(c.value, 10)]));
  const expiryWarn = cfg.membership_expiry_warning_days ?? 7;
  const paymentWarn = cfg.payment_due_warning_days ?? 3;

  warningDate.setDate(warningDate.getDate() + expiryWarn);
  const expiryWarnDate = warningDate.toISOString().slice(0, 10);
  const paymentWarnDate = new Date(Date.now() + paymentWarn * 86400000).toISOString().slice(0, 10);

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: frozenMembers },
    { count: expiredMembers },
    { count: activeInstructors },
    { data: expiringMemberships },
    { data: unpaidMemberships },
    { data: equipmentAlerts },
    { data: activeNotifications },
    { data: recentMembers },
    { data: revenueData },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').neq('status', 'deleted'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'active'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'frozen'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'expired'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'instructor').eq('status', 'active'),
    supabaseAdmin.from('member_memberships')
      .select('id, member_id, end_date, users!member_id(id, name, status)')
      .gt('end_date', today)
      .lte('end_date', expiryWarnDate)
      .order('end_date', { ascending: true })
      .limit(5),
    supabaseAdmin.from('member_memberships')
      .select('id, member_id, final_price, end_date, users!member_id(id, name)')
      .eq('paid', false)
      .lte('end_date', paymentWarnDate)
      .order('end_date', { ascending: true })
      .limit(5),
    supabaseAdmin.from('equipment')
      .select('id, name, status, next_service_due')
      .in('status', ['out_of_order', 'needs_service'])
      .neq('status', 'retired')
      .order('status', { ascending: true })
      .limit(5),
    supabaseAdmin.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin.from('users')
      .select('id, name, created_at, member_profiles(joined_at)')
      .eq('role', 'member')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin.from('member_memberships')
      .select('final_price, paid_date')
      .eq('paid', true)
      .gte('paid_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
  ]);

  const revenueThisMonth = (revenueData || []).reduce((sum, r) => sum + Number(r.final_price), 0);

  return {
    stats: { totalMembers, activeMembers, frozenMembers, expiredMembers, activeInstructors, revenueThisMonth },
    expiringMemberships: expiringMemberships || [],
    unpaidMemberships: unpaidMemberships || [],
    equipmentAlerts: equipmentAlerts || [],
    notificationCount: activeNotifications || 0,
    recentMembers: recentMembers || [],
  };
}

function StatCard({ label, value, sub, icon: Icon, color, href }) {
  const card = (
    <article className="stat-card">
      <div className={`stat-icon icon-${color}`}><Icon size={19} /></div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
          <strong>{value ?? '—'}</strong>
        </div>
        {sub && <small>{sub}</small>}
      </div>
    </article>
  );
  return href ? <Link href={href} className="stat-card-link">{card}</Link> : card;
}

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!data) {
    return (
      <div className="setup-banner">
        <span><AlertTriangle size={17} /><strong>Database not connected.</strong> Configure Supabase environment variables to load live data.</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DASHBOARD <span className="heading-line" /></div>
          <h1>{greeting()}, {session?.name?.split(' ')[0]}</h1>
          <p>Here's what's happening at your gym today.</p>
        </div>
      </div>

      {/* Stats */}
      <section className="stats-grid">
        <StatCard label="Total Members"      value={data.stats.totalMembers}     sub="All registered members"  icon={Users}      color="green"  href="/members" />
        <StatCard label="Active Memberships" value={data.stats.activeMembers}    sub="Currently active"        icon={ShieldCheck} color="blue"   href="/members?status=active" />
        <StatCard label="Revenue This Month" value={formatCurrency(data.stats.revenueThisMonth)} sub="Recorded payments"  icon={Wallet}     color="orange" href="/reports" />
        <StatCard label="Notifications"      value={data.notificationCount}      sub="Require attention"       icon={Bell}        color="pink"   href="/notifications" />
      </section>

      {/* Member status row */}
      <section className="stats-grid" style={{ marginTop: 12 }}>
        <StatCard label="Frozen Members"     value={data.stats.frozenMembers}    sub="Memberships paused"      icon={Snowflake}  color="blue"   href="/members?status=frozen" />
        <StatCard label="Expired Members"    value={data.stats.expiredMembers}   sub="Need renewal"            icon={AlertTriangle} color="orange" href="/members?status=expired" />
        <StatCard label="Active Instructors" value={data.stats.activeInstructors} sub="On staff"              icon={TrendingUp} color="green"  href="/instructors" />
        <StatCard label="Equipment Alerts"   value={data.equipmentAlerts.length} sub="Need attention"          icon={Wrench}     color="pink"   href="/equipment" />
      </section>

      <div className="overview-grid" style={{ marginTop: 16 }}>
        {/* Expiring memberships */}
        <article className="panel members-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">ACTION REQUIRED</span><h2>Expiring soon</h2></div>
            <Link href="/members?status=expiring" className="text-link">View all</Link>
          </div>
          {data.expiringMemberships.length === 0 ? (
            <p className="panel-empty">No memberships expiring soon.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>MEMBER</th><th>EXPIRES</th><th>DAYS LEFT</th><th>STATUS</th></tr></thead>
                <tbody>
                  {data.expiringMemberships.map((m) => (
                    <tr key={m.id}>
                      <td><Link href={`/members/${m.users?.id}`} className="table-link">{m.users?.name}</Link></td>
                      <td className="muted-cell">{formatDate(m.end_date)}</td>
                      <td className="muted-cell">{daysUntil(m.end_date)} days</td>
                      <td><StatusBadge status={m.users?.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {/* Unpaid memberships */}
        <article className="panel payments-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">PAYMENTS</span><h2>Unpaid</h2></div>
            <Link href="/memberships?filter=unpaid" className="text-link">View all</Link>
          </div>
          {data.unpaidMemberships.length === 0 ? (
            <p className="panel-empty">No outstanding payments.</p>
          ) : (
            <div className="payment-list">
              {data.unpaidMemberships.map((m) => (
                <div className="payment-row" key={m.id}>
                  <span className="payment-person">
                    <strong>{m.users?.name}</strong>
                    <small>Due {formatDate(m.end_date)}</small>
                  </span>
                  <span className="payment-amount">{formatCurrency(m.final_price)}</span>
                  <StatusBadge status="unpaid" />
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Equipment alerts */}
      {data.equipmentAlerts.length > 0 && (
        <article className="panel members-panel" style={{ marginTop: 14 }}>
          <div className="panel-heading">
            <div><span className="eyebrow">EQUIPMENT</span><h2>Needs attention</h2></div>
            <Link href="/equipment" className="text-link">View all</Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>EQUIPMENT</th><th>STATUS</th><th>NEXT SERVICE</th></tr></thead>
              <tbody>
                {data.equipmentAlerts.map((e) => (
                  <tr key={e.id}>
                    <td><Link href={`/equipment`} className="table-link">{e.name}</Link></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="muted-cell">{formatDate(e.next_service_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Recent members */}
      <article className="panel members-panel" style={{ marginTop: 14 }}>
        <div className="panel-heading">
          <div><span className="eyebrow">COMMUNITY</span><h2>Recent members</h2></div>
          <Link href="/members" className="text-link">All members</Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>MEMBER</th><th>JOINED</th><th>STATUS</th></tr></thead>
            <tbody>
              {data.recentMembers.map((m) => (
                <tr key={m.id}>
                  <td><Link href={`/members/${m.id}`} className="table-link">{m.name}</Link></td>
                  <td className="muted-cell">{formatDate(m.member_profiles?.[0]?.joined_at)}</td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
