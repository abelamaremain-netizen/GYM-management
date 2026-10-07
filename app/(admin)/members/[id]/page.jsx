import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../../lib/supabase';
import { formatDate, formatCurrency, daysUntil } from '../../../../lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '../../../../components/ui/StatusBadge';
import Avatar from '../../../../components/ui/Avatar';
import MemberActions from '../../../../components/members/MemberActions';
import AssignMembershipModal from '../../../../components/memberships/AssignMembershipModal';
import { getMemberById, getMemberFreezeHistory, getActivePlans, IS_DEMO } from '../../../../lib/db/index';

async function getMember(id) {
  if (IS_DEMO) return getMemberById(id);
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from('users')
    .select(`
      id, name, email, phone, status, created_at, deleted_at,
      member_profiles(
        date_of_birth, gender, emergency_contact_name,
        emergency_contact_phone, health_notes, joined_at
      ),
      member_memberships(
        id, plan_name, plan_duration_days, original_price, discount_amount,
        final_price, start_date, end_date, paid, paid_date, grace_until, notes, created_at
      )
    `)
    .eq('id', id)
    .eq('role', 'member')
    .single();

  return data || null;
}

async function getFreezeHistory(memberId) {
  if (IS_DEMO) return getMemberFreezeHistory(memberId);
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('membership_freezes')
    .select('id, freeze_start, freeze_end, reason, created_at, users!created_by(name)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  return data || [];
}

async function getActivePlansForMember() {
  if (IS_DEMO) return getActivePlans();
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('membership_plans')
    .select('id, name, duration_days, final_price')
    .eq('is_active', true)
    .order('duration_days', { ascending: true });
  return data || [];
}

export default async function MemberDetailPage({ params }) {
  const { id } = await params;
  const [member, freezeHistory, plans] = await Promise.all([
    getMember(id),
    getFreezeHistory(id),
    getActivePlansForMember(),
  ]);

  if (!member) notFound();

  const profile = member.member_profiles?.[0];
  const memberships = [...(member.member_memberships || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const activeMembership = memberships[0] || null;

  const today = new Date().toISOString().slice(0, 10);
  const isInGrace = activeMembership?.grace_until && activeMembership.grace_until >= today;
  const isExpired = activeMembership?.end_date < today && !isInGrace;

  function getCheckinStatus() {
    if (member.status === 'frozen') return { color: 'red', label: 'BLOCKED — Frozen' };
    if (member.status === 'deleted') return { color: 'red', label: 'BLOCKED — Deleted' };
    if (!activeMembership) return { color: 'red', label: 'BLOCKED — No membership' };
    if (isExpired) return { color: 'red', label: 'BLOCKED — Expired' };
    if (isInGrace) return { color: 'yellow', label: `CAUTION — Grace period until ${formatDate(activeMembership.grace_until)}` };
    if (!activeMembership.paid) return { color: 'yellow', label: 'CAUTION — Payment due' };
    return { color: 'green', label: 'ALLOW — Active member' };
  }

  const checkin = getCheckinStatus();

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/members" className="back-link"><ArrowLeft size={15} /> Back to members</Link>
      </div>

      {/* Header */}
      <div className="member-detail-header">
        <Avatar name={member.name} size="lg" />
        <div>
          <h1 className="member-detail-name">{member.name}</h1>
          <div className="member-detail-meta">
            <StatusBadge status={member.status} />
            <span className="muted-cell">{member.email || 'No email'}</span>
            <span className="muted-cell">{member.phone || 'No phone'}</span>
          </div>
        </div>
        <div className="member-detail-actions">
          <MemberActions member={member} activeMembership={activeMembership} />
        </div>
      </div>

      {/* Check-in status banner */}
      <div className={`checkin-banner checkin-banner-${checkin.color}`}>
        <i /><strong>Door check-in:</strong> {checkin.label}
      </div>

      <div className="detail-grid">
        {/* Profile */}
        <article className="panel detail-panel">
          <div className="panel-heading"><h2>Profile</h2></div>
          <dl className="detail-list">
            <dt>Full name</dt><dd>{member.name}</dd>
            <dt>Email</dt><dd>{member.email || '—'}</dd>
            <dt>Phone</dt><dd>{member.phone || '—'}</dd>
            <dt>Gender</dt><dd>{profile?.gender || '—'}</dd>
            <dt>Date of birth</dt><dd>{formatDate(profile?.date_of_birth)}</dd>
            <dt>Member since</dt><dd>{formatDate(profile?.joined_at)}</dd>
            <dt>Emergency contact</dt><dd>{profile?.emergency_contact_name || '—'}</dd>
            <dt>Emergency phone</dt><dd>{profile?.emergency_contact_phone || '—'}</dd>
            <dt>Health notes</dt><dd>{profile?.health_notes || '—'}</dd>
          </dl>
        </article>

        {/* Current membership */}
        <article className="panel detail-panel">
          <div className="panel-heading">
            <h2>Current Membership</h2>
            <AssignMembershipModal memberId={member.id} plans={plans} />
          </div>
          {activeMembership ? (
            <dl className="detail-list">
              <dt>Plan</dt><dd>{activeMembership.plan_name}</dd>
              <dt>Start date</dt><dd>{formatDate(activeMembership.start_date)}</dd>
              <dt>End date</dt><dd>{formatDate(activeMembership.end_date)}</dd>
              {activeMembership.grace_until && <><dt>Grace until</dt><dd>{formatDate(activeMembership.grace_until)}</dd></>}
              <dt>Original price</dt><dd>{formatCurrency(activeMembership.original_price)}</dd>
              {activeMembership.discount_amount > 0 && <><dt>Discount</dt><dd>- {formatCurrency(activeMembership.discount_amount)}</dd></>}
              <dt>Final price</dt><dd><strong>{formatCurrency(activeMembership.final_price)}</strong></dd>
              <dt>Payment</dt>
              <dd>
                <StatusBadge status={activeMembership.paid ? 'paid' : 'unpaid'} />
                {activeMembership.paid_date && <span className="muted-cell" style={{ marginLeft: 6 }}>on {formatDate(activeMembership.paid_date)}</span>}
              </dd>
              {activeMembership.notes && <><dt>Notes</dt><dd>{activeMembership.notes}</dd></>}
            </dl>
          ) : (
            <p className="panel-empty">No membership assigned.</p>
          )}
        </article>
      </div>

      {/* Freeze history */}
      {freezeHistory.length > 0 && (
        <article className="panel members-panel" style={{ marginTop: 14 }}>
          <div className="panel-heading"><h2>Freeze History</h2></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>FROM</th><th>TO</th><th>REASON</th><th>CREATED BY</th></tr></thead>
              <tbody>
                {freezeHistory.map((f) => (
                  <tr key={f.id}>
                    <td className="muted-cell">{formatDate(f.freeze_start)}</td>
                    <td className="muted-cell">{formatDate(f.freeze_end)}</td>
                    <td>{f.reason || '—'}</td>
                    <td className="muted-cell">{f.users?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Membership history */}
      {memberships.length > 1 && (
        <article className="panel members-panel" style={{ marginTop: 14 }}>
          <div className="panel-heading"><h2>Membership History</h2></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>PLAN</th><th>START</th><th>END</th><th>PRICE</th><th>PAID</th></tr></thead>
              <tbody>
                {memberships.slice(1).map((m) => (
                  <tr key={m.id}>
                    <td>{m.plan_name}</td>
                    <td className="muted-cell">{formatDate(m.start_date)}</td>
                    <td className="muted-cell">{formatDate(m.end_date)}</td>
                    <td className="muted-cell">{formatCurrency(m.final_price)}</td>
                    <td><StatusBadge status={m.paid ? 'paid' : 'unpaid'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </>
  );
}
