import { supabaseAdmin } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import { Wrench } from 'lucide-react';
import AddEquipmentModal from '../../../components/equipment/AddEquipmentModal';
import EquipmentActions from '../../../components/equipment/EquipmentActions';
import Link from 'next/link';

async function getEquipment(status, category) {
  if (!supabaseAdmin) return { equipment: [], categories: [] };

  let query = supabaseAdmin
    .from('equipment')
    .select('*')
    .order('name', { ascending: true });

  if (status && status !== 'all') query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data: equipment } = await query;

  // Get categories from config
  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'equipment_categories').single();
  const categories = cfg ? cfg.value.split(',').map((c) => c.trim()) : [];

  return { equipment: equipment || [], categories };
}

export default async function EquipmentPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || 'all';
  const category = params?.category || '';
  const { equipment, categories } = await getEquipment(status, category);

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Operational', value: 'operational' },
    { label: 'Needs Service', value: 'needs_service' },
    { label: 'Out of Order', value: 'out_of_order' },
    { label: 'Retired', value: 'retired' },
  ];

  return (
    <>
      <PageHeader eyebrow="EQUIPMENT" title="Equipment & Inventory" description="Track gym equipment, status, and maintenance.">
        <AddEquipmentModal categories={categories} />
      </PageHeader>

      <section className="panel page-panel">
        <div className="tab-bar">
          {tabs.map((t) => (
            <Link key={t.value} href={`/equipment?status=${t.value}${category ? `&category=${category}` : ''}`} className={`tab-item ${status === t.value ? 'tab-active' : ''}`}>{t.label}</Link>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="toolbar">
            <div className="filter-select">
              <Link href={`/equipment?status=${status}`} className={!category ? 'active-filter' : ''}>All categories</Link>
              {categories.map((cat) => (
                <Link key={cat} href={`/equipment?status=${status}&category=${cat}`} className={category === cat ? 'active-filter' : ''}>{cat}</Link>
              ))}
            </div>
          </div>
        )}

        <span className="result-count" style={{ display: 'block', margin: '8px 0' }}>
          {equipment.length} item{equipment.length !== 1 ? 's' : ''}
        </span>

        {equipment.length === 0 ? (
          <EmptyState icon={Wrench} title="No equipment found" description="Add your first equipment item." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>CATEGORY</th>
                  <th>SERIAL</th>
                  <th>STATUS</th>
                  <th>LAST SERVICED</th>
                  <th>NEXT SERVICE DUE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong>{item.notes && <small className="muted-cell" style={{ display: 'block' }}>{item.notes}</small>}</td>
                    <td><span className="plan-pill">{item.category}</span></td>
                    <td className="muted-cell">{item.serial_number || '—'}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="muted-cell">{formatDate(item.last_serviced)}</td>
                    <td className="muted-cell">{formatDate(item.next_service_due)}</td>
                    <td><EquipmentActions equipment={item} categories={categories} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
