'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { requireAdmin } from './_shared';
import { writeAuditLog, addDays } from '../utils';
import { syncMemberStatusAction } from './members';

// ── Create plan ───────────────────────────────────────────────
export async function createPlanAction(prevState, formData) {
  const admin         = await requireAdmin();
  const name          = formData.get('name')?.toString().trim();
  const durationDays  = parseInt(formData.get('duration_days'), 10);
  const originalPrice = parseFloat(formData.get('original_price'));
  const discount      = parseFloat(formData.get('discount_amount') || '0');

  if (!name) return { error: 'Plan name is required.' };
  if (isNaN(durationDays) || durationDays < 1) return { error: 'Duration must be at least 1 day.' };
  if (isNaN(originalPrice) || originalPrice < 0) return { error: 'Invalid price.' };
  if (isNaN(discount) || discount < 0 || discount > originalPrice) return { error: 'Discount cannot exceed the original price.' };

  const finalPrice = originalPrice - discount;

  const { error } = await supabaseAdmin.from('membership_plans').insert({
    name, duration_days: durationDays,
    original_price: originalPrice, discount_amount: discount,
    final_price: finalPrice, created_by: admin.id,
  });

  if (error) return { error: 'Failed to create plan.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'plan_created', entityType: 'membership_plan',
    performedBy: admin.id,
    newValue: { name, duration_days: durationDays, final_price: finalPrice },
  });

  revalidatePath('/memberships');
  return { success: true };
}

// ── Update plan ───────────────────────────────────────────────
export async function updatePlanAction(prevState, formData) {
  const admin         = await requireAdmin();
  const id            = formData.get('id')?.toString();
  const name          = formData.get('name')?.toString().trim();
  const durationDays  = parseInt(formData.get('duration_days'), 10);
  const originalPrice = parseFloat(formData.get('original_price'));
  const discount      = parseFloat(formData.get('discount_amount') || '0');

  if (!id) return { error: 'Plan ID missing.' };
  if (!name) return { error: 'Plan name is required.' };
  if (isNaN(durationDays) || durationDays < 1) return { error: 'Duration must be at least 1 day.' };
  if (isNaN(originalPrice) || originalPrice < 0) return { error: 'Invalid price.' };
  if (isNaN(discount) || discount < 0 || discount > originalPrice) return { error: 'Discount cannot exceed original price.' };

  const finalPrice = originalPrice - discount;

  const { error } = await supabaseAdmin.from('membership_plans').update({
    name, duration_days: durationDays,
    original_price: originalPrice, discount_amount: discount, final_price: finalPrice,
  }).eq('id', id);

  if (error) return { error: 'Failed to update plan.' };

  await writeAuditLog(supabaseAdmin, {
    action: 'plan_updated', entityType: 'membership_plan', entityId: id,
    performedBy: admin.id,
    newValue: { name, duration_days: durationDays, final_price: finalPrice },
  });

  revalidatePath('/memberships');
  return { success: true };
}

// ── Toggle plan active state ──────────────────────────────────
export async function togglePlanAction(planId, isActive) {
  const admin = await requireAdmin();

  const { error } = await supabaseAdmin
    .from('membership_plans').update({ is_active: isActive }).eq('id', planId);
  if (error) return { error: 'Failed to update plan status.' };

  await writeAuditLog(supabaseAdmin, {
    action: isActive ? 'plan_activated' : 'plan_deactivated',
    entityType: 'membership_plan', entityId: planId, performedBy: admin.id,
  });
  revalidatePath('/memberships');
  return { success: true };
}

// ── Assign membership to member ───────────────────────────────
export async function assignMembershipAction(prevState, formData) {
  const admin     = await requireAdmin();
  const memberId  = formData.get('member_id')?.toString();
  const planId    = formData.get('plan_id')?.toString();
  const startDate = formData.get('start_date')?.toString();
  const notes     = formData.get('notes')?.toString().trim() || null;

  if (!memberId || !planId || !startDate) {
    return { error: 'Member, plan, and start date are required.' };
  }

  // Task 8: Warn about overlapping active memberships
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseAdmin
    .from('member_memberships')
    .select('id, plan_name, end_date')
    .eq('member_id', memberId)
    .gte('end_date', todayStr)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      error: `This member already has an active "${existing.plan_name}" membership that expires on ${existing.end_date}. Assign a new plan only after the current one expires, or set a start date after ${existing.end_date}.`,
      overlap: true,
    };
  }

  const { data: plan } = await supabaseAdmin
    .from('membership_plans').select('*').eq('id', planId).single();
  if (!plan) return { error: 'Plan not found.' };
  if (!plan.is_active) return { error: 'This plan is no longer active.' };

  const endDate = addDays(startDate, plan.duration_days);

  const { error } = await supabaseAdmin.from('member_memberships').insert({
    member_id: memberId, plan_id: planId,
    plan_name: plan.name, plan_duration_days: plan.duration_days,
    original_price: plan.original_price, discount_amount: plan.discount_amount,
    final_price: plan.final_price,
    start_date: startDate, end_date: endDate,
    paid: false, notes, created_by: admin.id,
  });

  if (error) return { error: 'Failed to assign membership.' };

  // Task 3: Use syncMemberStatusAction instead of blindly setting active.
  // This respects frozen/deleted states.
  await syncMemberStatusAction(memberId);

  await writeAuditLog(supabaseAdmin, {
    action: 'membership_assigned', entityType: 'membership',
    entityId: memberId, performedBy: admin.id,
    newValue: { plan_name: plan.name, start_date: startDate, end_date: endDate },
  });

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/memberships');
  return { success: true };
}

// ── Mark paid / unpaid ────────────────────────────────────────
// Task 6: Returns error object instead of throwing
export async function markPaymentAction(membershipId, paid, memberId) {
  const admin = await requireAdmin();

  const update = paid
    ? { paid: true, paid_date: new Date().toISOString().slice(0, 10) }
    : { paid: false, paid_date: null };

  const { error } = await supabaseAdmin
    .from('member_memberships').update(update).eq('id', membershipId);

  if (error) return { error: 'Failed to update payment status.' };

  await writeAuditLog(supabaseAdmin, {
    action: paid ? 'payment_marked_paid' : 'payment_marked_unpaid',
    entityType: 'membership', entityId: membershipId, performedBy: admin.id,
    newValue: update,
  });

  revalidatePath('/memberships');
  if (memberId) revalidatePath(`/members/${memberId}`);
  return { success: true };
}

// ── Set grace period ──────────────────────────────────────────
// Task 15: Validate grace_until is after end_date
export async function setGracePeriodAction(prevState, formData) {
  const admin        = await requireAdmin();
  const membershipId = formData.get('membership_id')?.toString();
  const graceUntil   = formData.get('grace_until')?.toString();

  if (!membershipId || !graceUntil) return { error: 'Membership and grace date are required.' };

  // Validate it's a real date
  if (isNaN(new Date(graceUntil).getTime())) {
    return { error: 'Grace until must be a valid date.' };
  }

  // Fetch the membership to validate grace_until is after end_date
  const { data: membership } = await supabaseAdmin
    .from('member_memberships').select('end_date, member_id').eq('id', membershipId).single();

  if (!membership) return { error: 'Membership not found.' };
  if (graceUntil <= membership.end_date) {
    return { error: `Grace date must be after the membership end date (${membership.end_date}).` };
  }

  const { error } = await supabaseAdmin
    .from('member_memberships').update({ grace_until: graceUntil }).eq('id', membershipId);

  if (error) return { error: 'Failed to set grace period.' };

  // Re-sync member status — grace period may pull them back from expired
  await syncMemberStatusAction(membership.member_id);

  await writeAuditLog(supabaseAdmin, {
    action: 'grace_period_set', entityType: 'membership',
    entityId: membershipId, performedBy: admin.id,
    newValue: { grace_until: graceUntil },
  });

  revalidatePath('/memberships');
  revalidatePath(`/members/${membership.member_id}`);
  return { success: true };
}
