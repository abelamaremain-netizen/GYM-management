'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { getSession } from '../auth';
import { writeAuditLog, addDays, today } from '../utils';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

// ── Create equipment ──────────────────────────────────────────
export async function createEquipmentAction(prevState, formData) {
  const admin        = await requireAdmin();
  const name         = formData.get('name')?.toString().trim();
  const category     = formData.get('category')?.toString().trim();
  const serialNumber = formData.get('serial_number')?.toString().trim() || null;
  const purchaseDate = formData.get('purchase_date')?.toString() || null;
  const notes        = formData.get('notes')?.toString().trim() || null;

  if (!name) return { error: 'Equipment name is required.' };
  if (!category) return { error: 'Category is required.' };

  // Get service interval from config
  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'equipment_service_interval_days').single();
  const intervalDays = cfg ? parseInt(cfg.value, 10) : 30;
  const nextServiceDue = addDays(today(), intervalDays);

  const { error } = await supabaseAdmin.from('equipment').insert({
    name, category, serial_number: serialNumber, purchase_date: purchaseDate,
    status: 'operational', next_service_due: nextServiceDue,
    notes, created_by: admin.id,
  });

  if (error) return { error: 'Failed to create equipment.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'equipment_created', entityType: 'equipment',
    performedBy: admin.id, newValue: { name, category },
  });

  revalidatePath('/equipment');
  return { success: true };
}

// ── Update equipment ──────────────────────────────────────────
export async function updateEquipmentAction(prevState, formData) {
  const admin        = await requireAdmin();
  const id           = formData.get('id')?.toString();
  const name         = formData.get('name')?.toString().trim();
  const category     = formData.get('category')?.toString().trim();
  const serialNumber = formData.get('serial_number')?.toString().trim() || null;
  const purchaseDate = formData.get('purchase_date')?.toString() || null;
  const notes        = formData.get('notes')?.toString().trim() || null;

  if (!id) return { error: 'Equipment ID missing.' };

  const { error } = await supabaseAdmin.from('equipment').update({
    name, category, serial_number: serialNumber,
    purchase_date: purchaseDate, notes,
  }).eq('id', id);

  if (error) return { error: 'Failed to update equipment.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'equipment_updated', entityType: 'equipment',
    entityId: id, performedBy: admin.id,
    newValue: { name, category },
  });

  revalidatePath('/equipment');
  return { success: true };
}

// ── Change equipment status ───────────────────────────────────
export async function changeEquipmentStatusAction(prevState, formData) {
  const admin     = await requireAdmin();
  const id        = formData.get('id')?.toString();
  const newStatus = formData.get('status')?.toString();
  const notes     = formData.get('notes')?.toString().trim() || null;

  if (!id || !newStatus) return { error: 'Equipment and status are required.' };

  const { data: equipment } = await supabaseAdmin
    .from('equipment').select('status').eq('id', id).single();
  if (!equipment) return { error: 'Equipment not found.' };

  const updateData = { status: newStatus };
  if (newStatus === 'retired') updateData.retired_at = new Date().toISOString();

  await supabaseAdmin.from('equipment').update(updateData).eq('id', id);

  await supabaseAdmin.from('equipment_maintenance_logs').insert({
    equipment_id: id, action: newStatus === 'retired' ? 'retired' : 'status_changed',
    previous_status: equipment.status, new_status: newStatus,
    notes, performed_by: admin.id,
  });

  await writeAuditLog(supabaseAdmin, {
    action: 'equipment_status_changed', entityType: 'equipment',
    entityId: id, performedBy: admin.id,
    oldValue: { status: equipment.status }, newValue: { status: newStatus },
  });

  revalidatePath('/equipment');
  return { success: true };
}

// ── Mark equipment as serviced ────────────────────────────────
export async function markServicedAction(prevState, formData) {
  const admin = await requireAdmin();
  const id    = formData.get('id')?.toString();
  const notes = formData.get('notes')?.toString().trim() || null;

  if (!id) return { error: 'Equipment ID missing.' };

  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'equipment_service_interval_days').single();
  const intervalDays = cfg ? parseInt(cfg.value, 10) : 30;

  const servicedToday = today();
  const nextServiceDue = addDays(servicedToday, intervalDays);

  await supabaseAdmin.from('equipment').update({
    status: 'operational', last_serviced: servicedToday, next_service_due: nextServiceDue,
  }).eq('id', id);

  await supabaseAdmin.from('equipment_maintenance_logs').insert({
    equipment_id: id, action: 'serviced',
    previous_status: 'needs_service', new_status: 'operational',
    notes, performed_by: admin.id,
  });

  await writeAuditLog(supabaseAdmin, {
    action: 'equipment_serviced', entityType: 'equipment',
    entityId: id, performedBy: admin.id,
    newValue: { last_serviced: servicedToday, next_service_due: nextServiceDue },
  });

  revalidatePath('/equipment');
  return { success: true };
}

// ── Restore retired equipment ─────────────────────────────────
export async function restoreEquipmentAction(id) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('equipment').update({
    status: 'operational', retired_at: null,
  }).eq('id', id);

  await supabaseAdmin.from('equipment_maintenance_logs').insert({
    equipment_id: id, action: 'restored',
    previous_status: 'retired', new_status: 'operational',
    performed_by: admin.id,
  });

  await writeAuditLog(supabaseAdmin, {
    action: 'equipment_restored', entityType: 'equipment',
    entityId: id, performedBy: admin.id,
  });

  revalidatePath('/equipment');
}
