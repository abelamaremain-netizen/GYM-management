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

// ── Create member ─────────────────────────────────────────────
export async function createMemberAction(prevState, formData) {
  const admin = await requireAdmin();

  const name     = formData.get('name')?.toString().trim();
  const email    = formData.get('email')?.toString().trim().toLowerCase() || null;
  const phone    = formData.get('phone')?.toString().trim() || null;
  const dob      = formData.get('date_of_birth')?.toString() || null;
  const gender   = formData.get('gender')?.toString() || null;
  const ecName   = formData.get('emergency_contact_name')?.toString().trim() || null;
  const ecPhone  = formData.get('emergency_contact_phone')?.toString().trim() || null;
  const health   = formData.get('health_notes')?.toString().trim() || null;

  if (!name) return { error: 'Name is required.' };

  // Create user row
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({ name, email, phone, role: 'member', status: 'active' })
    .select('id')
    .single();

  if (userErr) {
    if (userErr.code === '23505') return { error: 'A member with this email already exists.' };
    return { error: 'Failed to create member.' };
  }

  // Create profile row
  await supabaseAdmin.from('member_profiles').insert({
    user_id: user.id,
    date_of_birth: dob,
    gender,
    emergency_contact_name: ecName,
    emergency_contact_phone: ecPhone,
    health_notes: health,
    joined_at: today(),
  });

  await writeAuditLog(supabaseAdmin, {
    action: 'member_created',
    entityType: 'member',
    entityId: user.id,
    performedBy: admin.id,
    newValue: { name, email, phone },
  });

  revalidatePath('/members');
  return { success: true, memberId: user.id };
}

// ── Update member ─────────────────────────────────────────────
export async function updateMemberAction(prevState, formData) {
  const admin = await requireAdmin();
  const id    = formData.get('id')?.toString();

  if (!id) return { error: 'Member ID missing.' };

  const name  = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase() || null;
  const phone = formData.get('phone')?.toString().trim() || null;

  const { data: old } = await supabaseAdmin
    .from('users').select('name, email, phone').eq('id', id).single();

  const { error } = await supabaseAdmin
    .from('users').update({ name, email, phone }).eq('id', id);

  if (error) return { error: 'Failed to update member.' };

  await supabaseAdmin.from('member_profiles').update({
    date_of_birth:           formData.get('date_of_birth') || null,
    gender:                  formData.get('gender') || null,
    emergency_contact_name:  formData.get('emergency_contact_name')?.toString().trim() || null,
    emergency_contact_phone: formData.get('emergency_contact_phone')?.toString().trim() || null,
    health_notes:            formData.get('health_notes')?.toString().trim() || null,
  }).eq('user_id', id);

  await writeAuditLog(supabaseAdmin, {
    action: 'member_updated',
    entityType: 'member',
    entityId: id,
    performedBy: admin.id,
    oldValue: old,
    newValue: { name, email, phone },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { success: true };
}

// ── Freeze member ─────────────────────────────────────────────
export async function freezeMemberAction(prevState, formData) {
  const admin       = await requireAdmin();
  const memberId    = formData.get('member_id')?.toString();
  const freezeStart = formData.get('freeze_start')?.toString();
  const freezeEnd   = formData.get('freeze_end')?.toString();
  const reason      = formData.get('reason')?.toString().trim() || null;

  if (!memberId || !freezeStart || !freezeEnd) {
    return { error: 'Member, start date and end date are required.' };
  }

  if (freezeEnd <= freezeStart) {
    return { error: 'End date must be after start date.' };
  }

  // Check max freeze days from config
  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'freeze_max_days').single();
  const maxDays = cfg ? parseInt(cfg.value, 10) : 30;
  const diffDays = Math.round((new Date(freezeEnd) - new Date(freezeStart)) / 86400000);
  if (diffDays > maxDays) {
    return { error: `Freeze duration cannot exceed ${maxDays} days.` };
  }

  // Insert freeze record
  const { error } = await supabaseAdmin.from('membership_freezes').insert({
    member_id: memberId, freeze_start: freezeStart, freeze_end: freezeEnd,
    reason, created_by: admin.id,
  });
  if (error) return { error: 'Failed to create freeze.' };

  // Update member status
  await supabaseAdmin.from('users').update({ status: 'frozen' }).eq('id', memberId);

  // Extend membership end_date by frozen days
  const { data: membership } = await supabaseAdmin
    .from('member_memberships')
    .select('id, end_date')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (membership) {
    const newEndDate = addDays(membership.end_date, diffDays);
    await supabaseAdmin
      .from('member_memberships')
      .update({ end_date: newEndDate })
      .eq('id', membership.id);
  }

  await writeAuditLog(supabaseAdmin, {
    action: 'member_frozen',
    entityType: 'member',
    entityId: memberId,
    performedBy: admin.id,
    newValue: { freeze_start: freezeStart, freeze_end: freezeEnd, reason },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

// ── Unfreeze member ───────────────────────────────────────────
export async function unfreezeMemberAction(memberId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('users').update({ status: 'active' }).eq('id', memberId);

  await writeAuditLog(supabaseAdmin, {
    action: 'member_unfrozen',
    entityType: 'member',
    entityId: memberId,
    performedBy: admin.id,
  });

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
}

// ── Soft delete member ────────────────────────────────────────
export async function deleteMemberAction(memberId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('users').update({
    status: 'deleted',
    deleted_at: new Date().toISOString(),
  }).eq('id', memberId);

  await writeAuditLog(supabaseAdmin, {
    action: 'member_deleted',
    entityType: 'member',
    entityId: memberId,
    performedBy: admin.id,
  });

  revalidatePath('/members');
}

// ── Restore deleted member ────────────────────────────────────
export async function restoreMemberAction(memberId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('users').update({
    status: 'active',
    deleted_at: null,
  }).eq('id', memberId);

  await writeAuditLog(supabaseAdmin, {
    action: 'member_restored',
    entityType: 'member',
    entityId: memberId,
    performedBy: admin.id,
  });

  revalidatePath('/members');
}
