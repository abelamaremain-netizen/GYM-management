'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { requireAdmin } from './_shared';

// ── Throttle: only regenerate once every 5 minutes per process ─
// This prevents 6–8 DB queries firing on every single page load.
let lastGenerated = 0;
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function generateNotificationsAction() {
  if (!supabaseAdmin) return;

  const now = Date.now();
  if (now - lastGenerated < THROTTLE_MS) return;
  lastGenerated = now;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch all config values in one query
  const { data: configs } = await supabaseAdmin
    .from('configurations')
    .select('key, value')
    .in('key', [
      'membership_expiry_warning_days',
      'payment_due_warning_days',
      'freeze_ending_warning_days',
      'equipment_service_due_warning_days',
    ]);

  const cfg = Object.fromEntries((configs || []).map((c) => [c.key, parseInt(c.value, 10)]));
  const expiryWarn  = isNaN(cfg.membership_expiry_warning_days)    ? 7 : cfg.membership_expiry_warning_days;
  const paymentWarn = isNaN(cfg.payment_due_warning_days)          ? 3 : cfg.payment_due_warning_days;
  const freezeWarn  = isNaN(cfg.freeze_ending_warning_days)        ? 3 : cfg.freeze_ending_warning_days;
  const equipWarn   = isNaN(cfg.equipment_service_due_warning_days)? 7 : cfg.equipment_service_due_warning_days;

  const candidates = [];

  // ── Memberships expiring soon ──────────────────────────────
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryWarn);
  const { data: expiring } = await supabaseAdmin
    .from('member_memberships')
    .select('member_id, end_date, users!member_id(name, status)')
    .gt('end_date', todayStr)
    .lte('end_date', expiryDate.toISOString().slice(0, 10));

  for (const m of expiring || []) {
    if (m.users?.status === 'deleted') continue;
    candidates.push({
      type: 'membership_expiring', entity_type: 'member', entity_id: m.member_id,
      message: `${m.users?.name}'s membership expires on ${m.end_date}.`,
    });
  }

  // ── Memberships expired — only most recent per member ──────
  // Fetch distinct expired members rather than all historical memberships
  const { data: expiredMembers } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('role', 'member')
    .eq('status', 'expired');

  for (const member of expiredMembers || []) {
    // Get their latest membership
    const { data: latest } = await supabaseAdmin
      .from('member_memberships')
      .select('end_date, grace_until')
      .eq('member_id', member.id)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) continue;
    if (latest.grace_until && latest.grace_until >= todayStr) continue;

    candidates.push({
      type: 'membership_expired', entity_type: 'member', entity_id: member.id,
      message: `${member.name}'s membership expired on ${latest.end_date}.`,
    });
  }

  // ── Unpaid memberships — only current/future ones ──────────
  // Exclude past-end_date memberships to avoid overlap with membership_expired
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() + paymentWarn);
  const { data: unpaid } = await supabaseAdmin
    .from('member_memberships')
    .select('member_id, end_date, users!member_id(name, status)')
    .eq('paid', false)
    .gte('end_date', todayStr)           // only active/future memberships
    .lte('end_date', paymentDate.toISOString().slice(0, 10));

  for (const m of unpaid || []) {
    if (m.users?.status === 'deleted') continue;
    candidates.push({
      type: 'payment_overdue', entity_type: 'member', entity_id: m.member_id,
      message: `${m.users?.name} has an unpaid membership (due ${m.end_date}).`,
    });
  }

  // ── Freezes ending soon ────────────────────────────────────
  const freezeDate = new Date();
  freezeDate.setDate(freezeDate.getDate() + freezeWarn);
  const { data: freezes } = await supabaseAdmin
    .from('membership_freezes')
    .select('member_id, freeze_end, users!member_id(name)')
    .gt('freeze_end', todayStr)
    .lte('freeze_end', freezeDate.toISOString().slice(0, 10));

  for (const f of freezes || []) {
    candidates.push({
      type: 'freeze_ending', entity_type: 'member', entity_id: f.member_id,
      message: `${f.users?.name}'s membership freeze ends on ${f.freeze_end}.`,
    });
  }

  // ── Equipment service due ──────────────────────────────────
  const serviceDate = new Date();
  serviceDate.setDate(serviceDate.getDate() + equipWarn);
  const { data: serviceDue } = await supabaseAdmin
    .from('equipment')
    .select('id, name, next_service_due')
    .neq('status', 'retired')
    .not('next_service_due', 'is', null)
    .lte('next_service_due', serviceDate.toISOString().slice(0, 10));

  for (const e of serviceDue || []) {
    candidates.push({
      type: 'equipment_service_due', entity_type: 'equipment', entity_id: e.id,
      message: `${e.name} is due for service on ${e.next_service_due}.`,
    });
  }

  // ── Equipment out of order ─────────────────────────────────
  const { data: outOfOrder } = await supabaseAdmin
    .from('equipment').select('id, name').eq('status', 'out_of_order');

  for (const e of outOfOrder || []) {
    candidates.push({
      type: 'equipment_out_of_order', entity_type: 'equipment', entity_id: e.id,
      message: `${e.name} is currently out of order.`,
    });
  }

  if (candidates.length === 0) return;

  // Task 9: Batch deduplication — fetch ALL existing active/seen notifications
  // in one query, then diff in memory instead of N+1 individual selects.
  const { data: existing } = await supabaseAdmin
    .from('notifications')
    .select('type, entity_id')
    .in('status', ['active', 'seen']);

  const existingSet = new Set(
    (existing || []).map((n) => `${n.type}::${n.entity_id}`)
  );

  const toInsert = candidates.filter(
    (c) => !existingSet.has(`${c.type}::${c.entity_id}`)
  );

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from('notifications').insert(toInsert);
    if (error) console.error('Failed to insert notifications:', error.message);
  }
}

// ── Dismiss notification ──────────────────────────────────────
export async function dismissNotificationAction(notificationId) {
  const admin = await requireAdmin();

  const { error } = await supabaseAdmin.from('notifications').update({
    status: 'dismissed',
    dismissed_by: admin.id,
    dismissed_at: new Date().toISOString(),
  }).eq('id', notificationId);

  if (error) return { error: 'Failed to dismiss notification.' };

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: true };
}

// ── Mark notification as seen ─────────────────────────────────
export async function markSeenAction(notificationId) {
  const { error } = await supabaseAdmin.from('notifications').update({
    status: 'seen', seen_at: new Date().toISOString(),
  }).eq('id', notificationId).eq('status', 'active');

  if (error) return { error: 'Failed to mark notification as seen.' };
  revalidatePath('/notifications');
  return { success: true };
}

// ── Resolve notification ──────────────────────────────────────
export async function resolveNotificationAction(notificationId) {
  const { error } = await supabaseAdmin.from('notifications').update({
    status: 'resolved', resolved_at: new Date().toISOString(),
  }).eq('id', notificationId);

  if (error) return { error: 'Failed to resolve notification.' };
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: true };
}
