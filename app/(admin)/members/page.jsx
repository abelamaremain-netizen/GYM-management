import { supabaseAdmin } from '../../../lib/supabase';
import { formatDate, daysUntil } from '../../../lib/utils';
import { Users } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import MembersToolbar from '../../../components/members/MembersToolbar';
import AddMemberModal from '../../../components/members/AddMemberModal';
import { getMembers as getMockMembers, IS_DEMO } from '../../../lib/db/index';

async function getMembers(status, search) {
  if (IS_DEMO) return getMockMembers({ status, search });
  if (!supabaseAdmin) return [];

  let query = supabaseAdmin
    .from('users')
    .select(`
      id, name, email, phone, status, created_at,
      member_profiles(joined_at, gender, date_of_birth),
      member_memberships(id, plan_name, end_date, paid, grace_until, start_date)
    `)
    .eq('role', 'member')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    if (status === 'deleted') {
      query = query.eq('status', 'deleted');
    } else {
      query = query.eq('status', status).is('deleted_at', null);
    }
  } else {
    query = query.neq('status', 'deleted');
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data } = await query;
  return data || [];
}

function getActiveMembership(memberships) {
  if (!memberships?.length) return null;
  return [...memberships].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
}

function getMemberCheckInStatus(member) {
  const membership = getActiveMembership(member.member_memberships);
  if (!membership) return { color: 'red', label: 'No membership' };

  const today = new Date().toISOString().slice(0, 10);
  if (member.status === 'frozen') return { color: 'red', label: 'Frozen' };
  if (member.status === 'expired') {
    if (membership.grace_until && membership.grace_until >= today) {
      return { color: 'yellow', label: `Grace until ${formatDate(membership.grace_until)}` };
    }
    return { color: 'red', label: 'Expired' };
  }
  if (!membership.paid) return { color: 'yellow', label: 'Payment due' };
  return { color: 'green', label: 'Active' };
}

export default async function MembersPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || 'all';
  const search = params?.search || '';
  const members = await getMembers(status, search);

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Frozen', value: 'frozen' },
    { label: 'Expired', value: 'expired' },
    { label: 'Deleted', value: 'deleted' },
  ];

  return (
    <>
      <PageHeader eyebrow="MEMBERS" title="Members" description="Manage gym member registrations and memberships.">
        <AddMemberModal />
      </PageHeader>

      <section className="panel page-panel">
        {/* Tabs */}
        <div className="tab-bar">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/members?status=${tab.value}${search ? `&search=${search}` : ''}`}
              className={`tab-item ${status === tab.value ? 'tab-active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <MembersToolbar search={search} status={status} />

        <span className="result-count" style={{ display: 'block', margin: '8px 0' }}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>

        {members.length === 0 ? (
          <EmptyState icon={Users} title="No members found" description="Try a different filter or add a new member." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>PHONE</th>
                  <th>PLAN</th>
                  <th>JOINED</th>
                  <th>EXPIRES</th>
                  <th>STATUS</th>
                  <th>CHECK-IN</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const membership = getActiveMembership(member.member_memberships);
                  const checkin = getMemberCheckInStatus(member);
                  return (
                    <tr key={member.id}>
                      <td>
                        <Link href={`/members/${member.id}`} className="member-cell">
                          <Avatar name={member.name} />
                          <span>
                            <strong>{member.name}</strong>
                            <small>{member.email || '—'}</small>
                          </span>
                        </Link>
                      </td>
                      <td className="muted-cell">{member.phone || '—'}</td>
                      <td>{membership ? <span className="plan-pill">{membership.plan_name}</span> : <span className="muted-cell">—</span>}</td>
                      <td className="muted-cell">{formatDate(member.member_profiles?.[0]?.joined_at)}</td>
                      <td className="muted-cell">
                        {membership ? (
                          <>
                            {formatDate(membership.end_date)}
                            {daysUntil(membership.end_date) <= 7 && daysUntil(membership.end_date) >= 0 && (
                              <span className="expiry-warn"> · {daysUntil(membership.end_date)}d left</span>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      <td><StatusBadge status={member.status} /></td>
                      <td>
                        <span className={`checkin-indicator checkin-${checkin.color}`}>
                          <i />{checkin.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
