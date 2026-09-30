'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { requireAdmin } from './_shared';
import { writeAuditLog, addDays, today } from '../utils';

// ── Create member ─────────────────────────────────────────────
export async function createMemberAction(prevState, formData) {
  const admin = await requireAdmin();

  const name    = formData.get('name')?.toString().trim();
  const email   = formData.get('email')?.toString().trim().toLowerCase() || null;
  const phone   = formData.get('phone')?.toString().trim() || null;
  const dob     = formData.get('date_of_birth')?.toString() || null;
  const gender  = formData.get('gender')?.toString() || null;
  const ecName  = formData.get('emergency_contact_name')?.toString().trim() || null;
  const ecPhone = formData.get('emergency_contact_phone')?.toString().trim() || null;
  const health  = formData.get('health_notes')?.toString().trim() || null;

  if (!name) return { error: 'Name is required.' };

  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({ name, email, phone, role: 'member', status: 'active' })
    .select('id')
    .single();

  if (userErr) {
    if (userErr.code === '23505') return { error: 'A member with this email already exists.' };
    return { error: 'Failed to create member.' };
  }

  const { error: profileErr } = await supabaseAdmin.from('member_profiles').insert({
    user_id: user.id, date_of_birth: dob, gender,
    emergency_contact_name: ecName, emergency_contact_phone: ecPhone,
    health_notes: health, joined_at: today(),
  });

  if (profileErr) return { error: 'Member created but profile failed to save.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'member_created', entityType: 'member', entityId: user.id,
    performedBy: admin.id, newValue: { name, email, phone },
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

  if (!name) return { error: 'Name is required.' };

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
    action: 'member_updated', entityType: 'member', entityId: id,
    performedBy: admin.id, oldValue: old, newValue: { name, email, phone },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${id}`);
  return { success: true };
}

// ── Sync member status based on current membership state ──────
// Called after any membership change and during expiry checks.
export async function syncMemberStatusAction(memberId) {
  const todayStr = today();

  // Get the most recent membership ordered by start_date (not created_at)
  const { data: membership } = await supabaseAdmin
    .from('member_memberships')
    .select('end_date, grace_until, paid')
    .eq('member_id', memberId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('status')
    .eq('id', memberId)
    .single();

  if (!user) return;

  // Never touch frozen or deleted — those are admin-managed states
  if (user.status === 'frozen' || user.status === 'deleted') return;

  if (!membership) {
    // No membership at all — mark expired
    await supabaseAdmin.from('users').update({ status: 'expired' }).eq('id', memberId);
    return;
  }

  const isInGrace = membership.grace_until && membership.grace_until >= todayStr;
  const isExpired = membership.end_date < todayStr && !isInGrace;

  if (isExpired && user.status !== 'expired') {
    await supabaseAdmin.from('users').update({ status: 'expired' }).eq('id', memberId);
  } else if (!isExpired && user.status === 'expired') {
    await supabaseAdmin.from('users').update({ status: 'active' }).eq('id', memberId);
  }
}

// ── Expire all members whose memberships have lapsed ──────────
// Called on dashboard load to keep statuses current.
export async function expireStaleMembers() {
  if (!supabaseAdmin) return;
  const todayStr = today();

  // Find active members with all memberships past end_date and no valid grace period
  const { data: active } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'member')
    .eq('status', 'active');

  if (!active?.length) return;

  // For each active member, check if their latest membership is expired
  // We do this in a single query by finding members whose most recent membership
  // end_date < today and grace_until is null or also past
  const memberIds = active.map((m) => m.id);

  // Get latest membership per member using a subquery approach:
  // Fetch all memberships for active members ordered by start_date desc
  const { data: memberships } = await supabaseAdmin
    .from('member_memberships')
    .select('member_id, end_date, grace_until')
    .in('member_id', memberIds)
    .order('start_date', { ascending: false });

  if (!memberships?.length) return;

  // Group by member — take first (most recent) per member
  const latestByMember = new Map();
  for (const m of memberships) {
    if (!latestByMember.has(m.member_id)) {
      latestByMember.set(m.member_id, m);
    }
  }

  // Members with no memberships at all
  const membersWithNoMembership = memberIds.filter((id) => !latestByMember.has(id));

  // Members whose latest membership is expired
  const toExpire = [];
  for (const [memberId, m] of latestByMember) {
    const isInGrace = m.grace_until && m.grace_until >= todayStr;
    if (m.end_date < todayStr && !isInGrace) {
      toExpire.push(memberId);
    }
  }

  const allToExpire = [...toExpire, ...membersWithNoMembership];
  if (allToExpire.length > 0) {
    await supabaseAdmin
      .from('users')
      .update({ status: 'expired' })
      .in('id', allToExpire);
  }
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

  // Task 4: Prevent double-freeze
  const { data: currentUser } = await supabaseAdmin
    .from('users').select('status').eq('id', memberId).single();
  if (!currentUser) return { error: 'Member not found.' };
  if (currentUser.status === 'frozen') {
    return { error: 'This member is already frozen. Unfreeze them before creating a new freeze.' };
  }

  // Check max freeze days from config
  const { data: cfg } = await supabaseAdmin
    .from('configurations').select('value').eq('key', 'freeze_max_days').single();
  const maxDays = cfg ? parseInt(cfg.value, 10) : 30;
  const diffDays = Math.round((new Date(freezeEnd) - new Date(freezeStart)) / 86400000);
  if (diffDays > maxDays) {
    return { error: `Freeze duration cannot exceed ${maxDays} days.` };
  }

  const { error: freezeErr } = await supabaseAdmin.from('membership_freezes').insert({
    member_id: memberId, freeze_start: freezeStart, freeze_end: freezeEnd,
    reason, created_by: admin.id,
  });
  if (freezeErr) return { error: 'Failed to create freeze.' };

  await supabaseAdmin.from('users').update({ status: 'frozen' }).eq('id', memberId);

  // Extend membership end_date by frozen days — order by start_date to get the correct active one
  const { data: membership } = await supabaseAdmin
    .from('member_memberships')
    .select('id, end_date')
    .eq('member_id', memberId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membership) {
    const newEndDate = addDays(membership.end_date, diffDays);
    const { error: extendErr } = await supabaseAdmin
      .from('member_memberships')
      .update({ end_date: newEndDate })
      .eq('id', membership.id);
    if (extendErr) return { error: 'Freeze created but failed to extend membership end date.' };
  }

  await writeAuditLog(supabaseAdmin, {
    action: 'member_frozen', entityType: 'member', entityId: memberId,
    performedBy: admin.id,
    newValue: { freeze_start: freezeStart, freeze_end: freezeEnd, reason, days_extended: diffDays },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

// ── Unfreeze member ───────────────────────────────────────────
export async function unfreezeMemberAction(memberId) {
  const admin = await requireAdmin();

  // Task 5: On early unfreeze, calculate how many days of the freeze were unused
  // and shorten the membership end_date back accordingly.
  const todayStr = today();

  const { data: activeFreeze } = await supabaseAdmin
    .from('membership_freezes')
    .select('id, freeze_start, freeze_end')
    .eq('member_id', memberId)
    .gte('freeze_end', todayStr)         // freeze hasn't fully elapsed yet
    .order('freeze_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeFreeze) {
    // Days remaining in the freeze that won't be used
    const unusedDays = Math.max(
      0,
      Math.round((new Date(activeFreeze.freeze_end) - new Date(todayStr)) / 86400000)
    );

    if (unusedDays > 0) {
      // Roll back the end_date extension for unused days
      const { data: membership } = await supabaseAdmin
        .from('member_memberships')
        .select('id, end_date')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membership) {
        const correctedEndDate = addDays(membership.end_date, -unusedDays);
        await supabaseAdmin
          .from('member_memberships')
          .update({ end_date: correctedEndDate })
          .eq('id', membership.id);
      }

      // Update freeze_end to today so history is accurate
      await supabaseAdmin
        .from('membership_freezes')
        .update({ freeze_end: todayStr })
        .eq('id', activeFreeze.id);
    }
  }

  const { error } = await supabaseAdmin
    .from('users').update({ status: 'active' }).eq('id', memberId);

  if (error) return { error: 'Failed to unfreeze member.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'member_unfrozen', entityType: 'member', entityId: memberId,
    performedBy: admin.id,
    newValue: { unfrozen_on: todayStr },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

// ── Soft delete member ────────────────────────────────────────
export async function deleteMemberAction(memberId) {
  const admin = await requireAdmin();

  const { error } = await supabaseAdmin.from('users').update({
    status: 'deleted',
    deleted_at: new Date().toISOString(),
  }).eq('id', memberId);

  if (error) return { error: 'Failed to delete member.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'member_deleted', entityType: 'member', entityId: memberId,
    performedBy: admin.id,
  });

  revalidatePath('/members');
  return { success: true };
}

// ── Restore deleted member ────────────────────────────────────
export async function restoreMemberAction(memberId) {
  const admin = await requireAdmin();

  // Restore to active — syncMemberStatusAction will correct to expired if needed
  const { error } = await supabaseAdmin.from('users').update({
    status: 'active',
    deleted_at: null,
  }).eq('id', memberId);

  if (error) return { error: 'Failed to restore member.' };

  // Sync correct status after restore
  await syncMemberStatusAction(memberId);

  await writeAuditLog(supabaseAdmin, {
    action: 'member_restored', entityType: 'member', entityId: memberId,
    performedBy: admin.id,
  });

  revalidatePath('/members');
  return { success: true };
}
