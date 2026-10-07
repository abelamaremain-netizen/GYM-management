import { supabaseAdmin } from '../../../lib/supabase';
import { formatCurrency, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';
import ManagePlansSection from '../../../components/memberships/ManagePlansSection';
import MembershipsTable from '../../../components/memberships/MembershipsTable';
import { getPlans as getMockPlans, getMemberships as getMockMemberships, IS_DEMO } from '../../../lib/db/index';

async function getPlans() {
  if (IS_DEMO) return getMockPlans();
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('membership_plans')
    .select('*, users!created_by(name)')
    .order('duration_days', { ascending: true });
  return data || [];
}

async function getMemberships(filter, page = 1) {
  if (IS_DEMO) return getMockMemberships({ filter, page });
  if (!supabaseAdmin) return { data: [], total: 0 };
  const PAGE_SIZE = 50;
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from('member_memberships')
    .select('*, users!member_id(id, name, status)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter === 'unpaid') query = query.eq('paid', false);
  if (filter === 'paid')   query = query.eq('paid', true);

  const { data, count, error } = await query;
  return { data: data || [], total: count || 0 };
}

export default async function MembershipsPage({ searchParams }) {
  const params = await searchParams;
  const filter = params?.filter || 'all';
  const page   = parseInt(params?.page || '1', 10);
  const [plans, { data: memberships, total }] = await Promise.all([getPlans(), getMemberships(filter, page)]);
  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <PageHeader eyebrow="BILLING" title="Memberships & Plans" description="Manage membership plans and member payment records." />

      <ManagePlansSection plans={plans} />

      <section className="panel page-panel" style={{ marginTop: 16 }}>
        <div className="panel-heading list-heading">
          <div><span className="eyebrow">PAYMENT RECORDS</span><h2>Member memberships</h2></div>
          <div className="tab-bar-inline">
            {[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']].map(([val, label]) => (
              <Link key={val} href={`/memberships?filter=${val}`} className={`tab-item ${filter === val ? 'tab-active' : ''}`}>{label}</Link>
            ))}
          </div>
        </div>
        <MembershipsTable memberships={memberships} />
        {totalPages > 1 && (
          <div className="table-footer">
            <span>Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total)</span>
            <div>
              {page > 1 && <Link href={`/memberships?filter=${filter}&page=${page - 1}`} className="button button-quiet">← Previous</Link>}
              {page < totalPages && <Link href={`/memberships?filter=${filter}&page=${page + 1}`} className="button button-quiet">Next →</Link>}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
