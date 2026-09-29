import { supabaseAdmin } from '../../../lib/supabase';
import { formatCurrency, formatDate } from '../../../lib/utils';
import Link from 'next/link';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';
import ManagePlansSection from '../../../components/memberships/ManagePlansSection';
import MembershipsTable from '../../../components/memberships/MembershipsTable';

async function getPlans() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('membership_plans')
    .select('*, users!created_by(name)')
    .order('duration_days', { ascending: true });
  return data || [];
}

async function getMemberships(filter) {
  if (!supabaseAdmin) return [];
  let query = supabaseAdmin
    .from('member_memberships')
    .select('*, users!member_id(id, name, status)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter === 'unpaid') query = query.eq('paid', false);
  if (filter === 'paid') query = query.eq('paid', true);

  const { data } = await query;
  return data || [];
}

export default async function MembershipsPage({ searchParams }) {
  const filter = searchParams?.filter || 'all';
  const [plans, memberships] = await Promise.all([getPlans(), getMemberships(filter)]);

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
      </section>
    </>
  );
}
