'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { requireAdmin } from './_shared';
import { hashPassword, writeAuditLog } from '../utils';

// ── Create instructor ─────────────────────────────────────────
export async function createInstructorAction(prevState, formData) {
  const admin          = await requireAdmin();
  const name           = formData.get('name')?.toString().trim();
  const email          = formData.get('email')?.toString().trim().toLowerCase();
  const phone          = formData.get('phone')?.toString().trim() || null;
  const specialization = formData.get('specialization')?.toString().trim() || null;
  const hourlyRateRaw  = formData.get('hourly_rate');
  const hourlyRate     = hourlyRateRaw ? parseFloat(hourlyRateRaw) : null;
  const contractType   = formData.get('contract_type')?.toString() || null;
  const joinedStaffAt  = formData.get('joined_staff_at')?.toString() || null;
  const password       = formData.get('password')?.toString();

  if (!name) return { error: 'Name is required.' };
  if (!email) return { error: 'Email is required.' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (hourlyRate !== null && isNaN(hourlyRate)) return { error: 'Hourly rate must be a valid number.' };

  const passwordHash = await hashPassword(password);

  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({ name, email, phone, role: 'instructor', status: 'active', password_hash: passwordHash })
    .select('id').single();

  if (userErr) {
    if (userErr.code === '23505') return { error: 'An instructor with this email already exists.' };
    return { error: 'Failed to create instructor.' };
  }

  const { error: profileErr } = await supabaseAdmin.from('instructor_profiles').insert({
    user_id: user.id, specialization,
    hourly_rate: hourlyRate, contract_type: contractType, joined_staff_at: joinedStaffAt,
  });
  if (profileErr) return { error: 'Instructor created but profile failed to save.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_created', entityType: 'instructor',
    entityId: user.id, performedBy: admin.id,
    newValue: { name, email, specialization, contract_type: contractType },
  });

  revalidatePath('/instructors');
  return { success: true };
}

// ── Update instructor ─────────────────────────────────────────
export async function updateInstructorAction(prevState, formData) {
  const admin          = await requireAdmin();
  const id             = formData.get('id')?.toString();
  const name           = formData.get('name')?.toString().trim();
  const email          = formData.get('email')?.toString().trim().toLowerCase();
  const phone          = formData.get('phone')?.toString().trim() || null;
  const specialization = formData.get('specialization')?.toString().trim() || null;
  const hourlyRateRaw  = formData.get('hourly_rate');
  const hourlyRate     = hourlyRateRaw ? parseFloat(hourlyRateRaw) : null;
  const contractType   = formData.get('contract_type')?.toString() || null;
  const joinedStaffAt  = formData.get('joined_staff_at')?.toString() || null;

  if (!id) return { error: 'Instructor ID missing.' };
  if (!name) return { error: 'Name is required.' };
  if (!email) return { error: 'Email is required.' };
  if (hourlyRate !== null && isNaN(hourlyRate)) return { error: 'Hourly rate must be a valid number.' };

  const { data: old } = await supabaseAdmin
    .from('users').select('name, email, phone').eq('id', id).single();

  const { error } = await supabaseAdmin
    .from('users').update({ name, email, phone }).eq('id', id);
  if (error) return { error: 'Failed to update instructor.' };

  const { error: profileErr } = await supabaseAdmin.from('instructor_profiles').update({
    specialization, hourly_rate: hourlyRate,
    contract_type: contractType, joined_staff_at: joinedStaffAt,
  }).eq('user_id', id);
  if (profileErr) return { error: 'User updated but profile failed to save.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_updated', entityType: 'instructor',
    entityId: id, performedBy: admin.id,
    oldValue: old, newValue: { name, email, phone, specialization },
  });

  revalidatePath('/instructors');
  return { success: true };
}

// ── Reset instructor password ─────────────────────────────────
export async function resetInstructorPasswordAction(prevState, formData) {
  const admin       = await requireAdmin();
  const id          = formData.get('id')?.toString();
  const newPassword = formData.get('new_password')?.toString();

  if (!id) return { error: 'Instructor ID missing.' };
  if (!newPassword || newPassword.length < 8) return { error: 'Password must be at least 8 characters.' };

  const passwordHash = await hashPassword(newPassword);
  const { error } = await supabaseAdmin
    .from('users').update({ password_hash: passwordHash }).eq('id', id);
  if (error) return { error: 'Failed to reset password.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_password_reset', entityType: 'instructor',
    entityId: id, performedBy: admin.id,
  });

  return { success: true };
}

// ── Soft delete instructor ────────────────────────────────────
export async function deleteInstructorAction(instructorId) {
  const admin = await requireAdmin();

  const { error } = await supabaseAdmin.from('users').update({
    status: 'deleted', deleted_at: new Date().toISOString(),
  }).eq('id', instructorId);
  if (error) return { error: 'Failed to delete instructor.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_deleted', entityType: 'instructor',
    entityId: instructorId, performedBy: admin.id,
  });

  revalidatePath('/instructors');
  return { success: true };
}

// ── Restore deleted instructor ────────────────────────────────
export async function restoreInstructorAction(instructorId) {
  const admin = await requireAdmin();

  const { error } = await supabaseAdmin.from('users').update({
    status: 'active', deleted_at: null,
  }).eq('id', instructorId);
  if (error) return { error: 'Failed to restore instructor.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_restored', entityType: 'instructor',
    entityId: instructorId, performedBy: admin.id,
  });

  revalidatePath('/instructors');
  return { success: true };
}
