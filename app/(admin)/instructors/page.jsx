import { supabaseAdmin } from '../../../lib/supabase';
import { formatDate, formatCurrency } from '../../../lib/utils';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { UserRound } from 'lucide-react';
import AddInstructorModal from '../../../components/instructors/AddInstructorModal';
import InstructorActions from '../../../components/instructors/InstructorActions';
import Link from 'next/link';
import { getInstructors as getMockInstructors, IS_DEMO } from '../../../lib/db/index';

const PAGE_SIZE = 25;

async function getInstructors(showDeleted, page) {
  if (IS_DEMO) {
    const all = getMockInstructors({ showDeleted });
    const from = (page - 1) * PAGE_SIZE;
    return { data: all.slice(from, from + PAGE_SIZE), total: all.length };
  }
  if (!supabaseAdmin) return { data: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, phone, status, created_at, instructor_profiles(*)', { count: 'exact' })
    .eq('role', 'instructor')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (showDeleted) {
    query = query.eq('status', 'deleted');
  } else {
    query = query.neq('status', 'deleted');
  }

  const { data, count } = await query;
  return { data: data || [], total: count || 0 };
}

export default async function InstructorsPage({ searchParams }) {
  const params      = await searchParams;
  const showDeleted = params?.status === 'deleted';
  const page        = Math.max(1, parseInt(params?.page || '1', 10));
  const { data: instructors, total } = await getInstructors(showDeleted, page);

  return (
    <>
      <PageHeader eyebrow="STAFF" title="Instructors" description="Manage gym instructors and their employment details.">
        <AddInstructorModal />
      </PageHeader>

      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <Link href="/instructors" className={`tab-item ${!showDeleted ? 'tab-active' : ''}`}>Active</Link>
        <Link href="/instructors?status=deleted" className={`tab-item ${showDeleted ? 'tab-active' : ''}`}>Deleted</Link>
      </div>

      <section className="panel page-panel">
        <span className="result-count" style={{ display: 'block', marginBottom: 10 }}>
          {total} instructor{total !== 1 ? 's' : ''}
        </span>

        {instructors.length === 0 ? (
          <EmptyState icon={UserRound} title="No instructors found" description="Add your first instructor to get started." />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>INSTRUCTOR</th>
                    <th>SPECIALIZATION</th>
                    <th>CONTRACT</th>
                    <th>HOURLY RATE</th>
                    <th>JOINED STAFF</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((instructor) => {
                    const profile = instructor.instructor_profiles?.[0];
                    return (
                      <tr key={instructor.id}>
                        <td>
                          <div className="member-cell">
                            <Avatar name={instructor.name} />
                            <span>
                              <strong>{instructor.name}</strong>
                              <small>{instructor.email}</small>
                            </span>
                          </div>
                        </td>
                        <td className="muted-cell">{profile?.specialization || '—'}</td>
                        <td className="muted-cell">{profile?.contract_type?.replace('_', ' ') || '—'}</td>
                        <td className="muted-cell">{profile?.hourly_rate ? formatCurrency(profile.hourly_rate) : '—'}</td>
                        <td className="muted-cell">{formatDate(profile?.joined_staff_at)}</td>
                        <td><StatusBadge status={instructor.status} /></td>
                        <td><InstructorActions instructor={instructor} profile={profile} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/instructors"
              params={{ status: showDeleted ? 'deleted' : '' }}
            />
          </>
        )}
      </section>
    </>
  );
}
