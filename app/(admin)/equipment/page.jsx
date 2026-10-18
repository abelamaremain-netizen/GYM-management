import { supabaseAdmin } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { Wrench } from 'lucide-react';
import AddEquipmentModal from '../../../components/equipment/AddEquipmentModal';
import EquipmentActions from '../../../components/equipment/EquipmentActions';
import Link from 'next/link';
import { getEquipment as getMockEquipment, getEquipmentCategories, IS_DEMO } from '../../../lib/db/index';

const PAGE_SIZE = 25;

async function getEquipment(status, category, page) {
  if (IS_DEMO) {
    const categories = getEquipmentCategories();
    const all = getMockEquipment({ status, category });
    const from = (page - 1) * PAGE_SIZE;
    return { equipment: all.slice(from, from + PAGE_SIZE), total: all.length, categories };
  }
  if (!supabaseAdmin) return { equipment: [], total: 0, categories: [] };

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from('equipment')
    .select('id, name, category, serial_number, status, last_serviced, next_service_due, notes', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (status && status !== 'all') query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data: equipment, count } = await query;

  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'equipment_categories').single();
  const categories = cfg ? cfg.value.split(',').map((c) => c.trim()) : [];

  return { equipment: equipment || [], total: count || 0, categories };
}

export default async function EquipmentPage({ searchParams }) {
  const params   = await searchParams;
  const status   = params?.status   || 'all';
  const category = params?.category || '';
  const page     = Math.max(1, parseInt(params?.page || '1', 10));

  const { equipment, total, categories } = await getEquipment(status, category, page);

  const tabs = [
    { label: 'All',          value: 'all'          },
    { label: 'Operational',  value: 'operational'  },
    { label: 'Needs Service',value: 'needs_service'},
    { label: 'Out of Order', value: 'out_of_order' },
    { label: 'Retired',      value: 'retired'      },
  ];

  return (
    <>
      <PageHeader eyebrow="EQUIPMENT" title="Equipment & Inventory" description="Track gym equipment, status, and maintenance.">
        <AddEquipmentModal categories={categories} />
      </PageHeader>

      <section className="panel page-panel">
        <div className="tab-bar">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={`/equipment?status=${t.value}${category ? `&category=${category}` : ''}`}
              className={`tab-item ${status === t.value ? 'tab-active' : ''}`}
            >
              {t.label}
            </Link>
          ))}
        </div>

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
          {total} item{total !== 1 ? 's' : ''}
        </span>

        {equipment.length === 0 ? (
          <EmptyState icon={Wrench} title="No equipment found" description="Add your first equipment item." />
        ) : (
          <>
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
                      <td>
                        <strong>{item.name}</strong>
                        {item.notes && <small className="muted-cell" style={{ display: 'block' }}>{item.notes}</small>}
                      </td>
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
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/equipment"
              params={{ status, category }}
            />
          </>
        )}
      </section>
    </>
  );
}
