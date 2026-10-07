import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import PageHeader from '../../../components/ui/PageHeader';
import ConfigurationsTable from '../../../components/configurations/ConfigurationsTable';
import { getConfigurations as getMockConfigurations, IS_DEMO } from '../../../lib/db/index';

async function getConfigurations() {
  if (IS_DEMO) return getMockConfigurations();
  if (!supabaseAdmin) return {};
  const { data } = await supabaseAdmin
    .from('configurations')
    .select('*, users!updated_by(name)')
    .order('group_name', { ascending: true });
  return data || [];
}

export default async function ConfigurationsPage() {
  const session = await getSession();
  const isSuperAdmin = session?.role === 'super_admin';
  const result = await getConfigurations();

  // Mock returns already-grouped object; Supabase returns an array — normalize
  const grouped = Array.isArray(result)
    ? result.reduce((acc, c) => {
        if (!acc[c.group_name]) acc[c.group_name] = [];
        acc[c.group_name].push(c);
        return acc;
      }, {})
    : result;

  return (
    <>
      <PageHeader
        eyebrow="SYSTEM"
        title="Configurations"
        description={isSuperAdmin ? 'Edit system-wide configurable values.' : 'View system configurations. Only super admins can edit.'}
      />

      {!isSuperAdmin && (
        <div className="setup-banner" style={{ marginBottom: 16 }}>
          <span>You need super admin access to edit configurations.</span>
        </div>
      )}

      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="panel page-panel" style={{ marginBottom: 14 }}>
          <div className="panel-heading">
            <div><span className="eyebrow">GROUP</span><h2 style={{ textTransform: 'capitalize' }}>{group}</h2></div>
          </div>
          <ConfigurationsTable configurations={items} canEdit={isSuperAdmin} />
        </section>
      ))}
    </>
  );
}
