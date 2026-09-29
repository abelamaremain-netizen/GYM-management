import { supabaseAdmin } from '../../../lib/supabase';
import { formatCurrency, formatDate } from '../../../lib/utils';
import PageHeader from '../../../components/ui/PageHeader';
import { FileText, Users, Wallet, ShieldCheck, UserRound } from 'lucide-react';

async function getReportData() {
  if (!supabaseAdmin) return null;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const firstOfYear  = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: frozenMembers },
    { count: expiredMembers },
    { count: deletedMembers },
    { count: totalInstructors },
    { data: revenueMonth },
    { data: revenueYear },
    { data: unpaidMemberships },
    { data: planBreakdown },
    { data: recentPayments },
    { data: newMembersMonth },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'active'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'frozen'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'expired'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'deleted'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'instructor').neq('status', 'deleted'),
    supabaseAdmin.from('member_memberships').select('final_price').eq('paid', true).gte('paid_date', firstOfMonth),
    supabaseAdmin.from('member_memberships').select('final_price').eq('paid', true).gte('paid_date', firstOfYear),
    supabaseAdmin.from('member_memberships').select('final_price').eq('paid', false),
    supabaseAdmin.from('member_memberships').select('plan_name').eq('paid', true),
    supabaseAdmin.from('member_memberships').select('*, users!member_id(name)').eq('paid', true).order('paid_date', { ascending: false }).limit(10),
    supabaseAdmin.from('users').select('id, name, created_at').eq('role', 'member').gte('created_at', firstOfMonth).order('created_at', { ascending: false }),
  ]);

  const revenueThisMonth = (revenueMonth || []).reduce((s, r) => s + Number(r.final_price), 0);
  const revenueThisYear  = (revenueYear  || []).reduce((s, r) => s + Number(r.final_price), 0);
  const outstandingAmount = (unpaidMemberships || []).reduce((s, r) => s + Number(r.final_price), 0);

  // Count plans
  const planCounts = (planBreakdown || []).reduce((acc, m) => {
    acc[m.plan_name] = (acc[m.plan_name] || 0) + 1;
    return acc;
  }, {});

  return {
    members: { total: totalMembers, active: activeMembers, frozen: frozenMembers, expired: expiredMembers, deleted: deletedMembers, newThisMonth: newMembersMonth?.length || 0 },
    instructors: { total: totalInstructors },
    revenue: { thisMonth: revenueThisMonth, thisYear: revenueThisYear, outstanding: outstandingAmount },
    planCounts,
    recentPayments: recentPayments || [],
  };
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon icon-${color}`}><Icon size={19} /></div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row"><strong>{value ?? '—'}</strong></div>
      </div>
    </article>
  );
}

export default async function ReportsPage() {
  const data = await getReportData();

  if (!data) {
    return (
      <>
        <PageHeader eyebrow="REPORTS" title="Reports & Analytics" />
        <div className="setup-banner"><span>Database not connected.</span></div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="REPORTS" title="Reports & Analytics" description="Overview of membership, payments, and operations." />

      <section>
        <div className="eyebrow" style={{ marginBottom: 10 }}>MEMBERSHIP</div>
        <div className="stats-grid">
          <StatCard label="Total members"     value={data.members.total}         icon={Users}      color="green"  />
          <StatCard label="Active"            value={data.members.active}        icon={ShieldCheck} color="blue"  />
          <StatCard label="Frozen"            value={data.members.frozen}        icon={Users}      color="orange" />
          <StatCard label="New this month"    value={data.members.newThisMonth}  icon={Users}      color="pink"   />
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>REVENUE</div>
        <div className="stats-grid">
          <StatCard label="Revenue this month" value={formatCurrency(data.revenue.thisMonth)} icon={Wallet} color="green" />
          <StatCard label="Revenue this year"  value={formatCurrency(data.revenue.thisYear)}  icon={Wallet} color="blue"  />
          <StatCard label="Outstanding"        value={formatCurrency(data.revenue.outstanding)} icon={Wallet} color="orange" />
          <StatCard label="Active instructors" value={data.instructors.total}                 icon={UserRound} color="pink" />
        </div>
      </section>

      {/* Plan breakdown */}
      {Object.keys(data.planCounts).length > 0 && (
        <article className="panel page-panel" style={{ marginTop: 20 }}>
          <div className="panel-heading"><div><span className="eyebrow">PLANS</span><h2>Revenue by plan</h2></div></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>PLAN</th><th>PAID MEMBERSHIPS</th></tr></thead>
              <tbody>
                {Object.entries(data.planCounts).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                  <tr key={plan}><td>{plan}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Recent payments */}
      <article className="panel page-panel" style={{ marginTop: 14 }}>
        <div className="panel-heading"><div><span className="eyebrow">PAYMENTS</span><h2>Recent paid memberships</h2></div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>MEMBER</th><th>PLAN</th><th>AMOUNT</th><th>PAID DATE</th></tr></thead>
            <tbody>
              {data.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.users?.name}</td>
                  <td><span className="plan-pill">{p.plan_name}</span></td>
                  <td>{formatCurrency(p.final_price)}</td>
                  <td className="muted-cell">{formatDate(p.paid_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
