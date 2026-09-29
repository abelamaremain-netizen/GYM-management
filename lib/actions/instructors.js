'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { getSession } from '../auth';
import { hashPassword, writeAuditLog } from '../utils';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

// ── Create instructor ─────────────────────────────────────────
export async function createInstructorAction(prevState, formData) {
  const admin          = await requireAdmin();
  const name           = formData.get('name')?.toString().trim();
  const email          = formData.get('email')?.toString().trim().toLowerCase();
  const phone          = formData.get('phone')?.toString().trim() || null;
  const specialization = formData.get('specialization')?.toString().trim() || null;
  const hourlyRate     = parseFloat(formData.get('hourly_rate') || '0');
  const contractType   = formData.get('contract_type')?.toString() || null;
  const joinedStaffAt  = formData.get('joined_staff_at')?.toString() || null;
  const password       = formData.get('password')?.toString();

  if (!name) return { error: 'Name is required.' };
  if (!email) return { error: 'Email is required.' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const passwordHash = await hashPassword(password);

  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({ name, email, phone, role: 'instructor', status: 'active', password_hash: passwordHash })
    .select('id').single();

  if (userErr) {
    if (userErr.code === '23505') return { error: 'An instructor with this email already exists.' };
    return { error: 'Failed to create instructor.' };
  }

  await supabaseAdmin.from('instructor_profiles').insert({
    user_id: user.id, specialization, hourly_rate: hourlyRate,
    contract_type: contractType, joined_staff_at: joinedStaffAt,
  });

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
  const hourlyRate     = parseFloat(formData.get('hourly_rate') || '0');
  const contractType   = formData.get('contract_type')?.toString() || null;
  const joinedStaffAt  = formData.get('joined_staff_at')?.toString() || null;

  if (!id) return { error: 'Instructor ID missing.' };

  const { data: old } = await supabaseAdmin
    .from('users').select('name, email, phone').eq('id', id).single();

  const { error } = await supabaseAdmin
    .from('users').update({ name, email, phone }).eq('id', id);
  if (error) return { error: 'Failed to update instructor.' };

  await supabaseAdmin.from('instructor_profiles').update({
    specialization, hourly_rate: hourlyRate,
    contract_type: contractType, joined_staff_at: joinedStaffAt,
  }).eq('user_id', id);

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_updated', entityType: 'instructor',
    entityId: id, performedBy: admin.id,
    oldValue: old, newValue: { name, email, phone, specialization },
  });

  revalidatePath('/instructors');
  revalidatePath(`/instructors/${id}`);
  return { success: true };
}

// ── Reset instructor password ─────────────────────────────────
export async function resetInstructorPasswordAction(prevState, formData) {
  const admin      = await requireAdmin();
  const id         = formData.get('id')?.toString();
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

  revalidatePath(`/instructors/${id}`);
  return { success: true };
}

// ── Soft delete instructor ────────────────────────────────────
export async function deleteInstructorAction(instructorId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('users').update({
    status: 'deleted', deleted_at: new Date().toISOString(),
  }).eq('id', instructorId);

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_deleted', entityType: 'instructor',
    entityId: instructorId, performedBy: admin.id,
  });

  revalidatePath('/instructors');
}

// ── Restore deleted instructor ────────────────────────────────
export async function restoreInstructorAction(instructorId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('users').update({
    status: 'active', deleted_at: null,
  }).eq('id', instructorId);

  await writeAuditLog(supabaseAdmin, {
    action: 'instructor_restored', entityType: 'instructor',
    entityId: instructorId, performedBy: admin.id,
  });

  revalidatePath('/instructors');
}
