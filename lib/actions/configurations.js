'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { getSession } from '../auth';
import { writeAuditLog } from '../utils';

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (session.role !== 'super_admin') throw new Error('Only super admins can edit configurations.');
  return session;
}

export async function updateConfigAction(prevState, formData) {
  const admin = await requireSuperAdmin();
  const id    = formData.get('id')?.toString();
  const value = formData.get('value')?.toString().trim();

  if (!id || value === undefined) return { error: 'ID and value are required.' };

  const { data: old } = await supabaseAdmin
    .from('configurations').select('key, value').eq('id', id).single();

  const { error } = await supabaseAdmin.from('configurations').update({
    value, updated_by: admin.id, updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: 'Failed to update configuration.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'config_updated', entityType: 'configuration',
    entityId: id, performedBy: admin.id,
    oldValue: { key: old?.key, value: old?.value },
    newValue: { key: old?.key, value },
  });

  revalidatePath('/configurations');
  return { success: true };
}
