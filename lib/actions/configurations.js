'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { requireSuperAdmin } from './_shared';
import { writeAuditLog } from '../utils';

// Task 16: Validate value against the config's declared type before saving
function validateConfigValue(value, type) {
  switch (type) {
    case 'integer': {
      const n = parseInt(value, 10);
      if (isNaN(n) || String(n) !== value.trim()) return 'Must be a whole number (e.g. 7).';
      if (n < 0) return 'Must be a positive number.';
      return null;
    }
    case 'decimal': {
      const n = parseFloat(value);
      if (isNaN(n)) return 'Must be a number (e.g. 1.5).';
      if (n < 0) return 'Must be a positive number.';
      return null;
    }
    case 'boolean': {
      if (value !== 'true' && value !== 'false') return 'Must be "true" or "false".';
      return null;
    }
    case 'string':
      if (!value.trim()) return 'Value cannot be empty.';
      return null;
    default:
      return null;
  }
}

export async function updateConfigAction(prevState, formData) {
  const admin = await requireSuperAdmin();
  const id    = formData.get('id')?.toString();
  const value = formData.get('value')?.toString().trim();

  if (!id || value === undefined || value === null) return { error: 'ID and value are required.' };

  // Fetch existing config to get its type and current value
  const { data: old } = await supabaseAdmin
    .from('configurations').select('key, value, type').eq('id', id).single();

  if (!old) return { error: 'Configuration not found.' };

  // Validate value against declared type
  const validationError = validateConfigValue(value, old.type);
  if (validationError) return { error: `Invalid value for "${old.key}": ${validationError}` };

  const { error } = await supabaseAdmin.from('configurations').update({
    value, updated_by: admin.id, updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: 'Failed to update configuration.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'config_updated', entityType: 'configuration',
    entityId: id, performedBy: admin.id,
    oldValue: { key: old.key, value: old.value },
    newValue: { key: old.key, value },
  });

  revalidatePath('/configurations');
  return { success: true };
}
