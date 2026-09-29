'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../supabase';
import { getSession } from '../auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

/**
 * Generate all notifications based on current data conditions.
 * Called on dashboard load and notification page load.
 * Deduplicates — skips if active notification of same type+entity exists.
 */
export async function generateNotificationsAction() {
  if (!supabaseAdmin) return;

  const now = new Date().toISOString().slice(0, 10);

  // Fetch config values
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
  const expiryWarn   = cfg.membership_expiry_warning_days   ?? 7;
  const paymentWarn  = cfg.payment_due_warning_days         ?? 3;
  const freezeWarn   = cfg.freeze_ending_warning_days       ?? 3;
  const equipWarn    = cfg.equipment_service_due_warning_days ?? 7;

  const toInsert = [];

  // ── Memberships expiring soon ──────────────────────────────
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryWarn);
  const { data: expiring } = await supabaseAdmin
    .from('member_memberships')
    .select('id, member_id, end_date, users!member_id(name)')
    .gt('end_date', now)
    .lte('end_date', expiryDate.toISOString().slice(0, 10));

  for (const m of expiring || []) {
    toInsert.push({
      type: 'membership_expiring', entity_type: 'member', entity_id: m.member_id,
      message: `${m.users?.name}'s membership expires on ${m.end_date}.`,
    });
  }

  // ── Memberships expired ────────────────────────────────────
  const { data: expired } = await supabaseAdmin
    .from('member_memberships')
    .select('id, member_id, end_date, grace_until, users!member_id(name, status)')
    .lt('end_date', now);

  for (const m of expired || []) {
    if (m.grace_until && m.grace_until >= now) continue; // still in grace
    if (m.users?.status === 'deleted') continue;
    toInsert.push({
      type: 'membership_expired', entity_type: 'member', entity_id: m.member_id,
      message: `${m.users?.name}'s membership expired on ${m.end_date}.`,
    });
  }

  // ── Unpaid memberships due soon ────────────────────────────
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() + paymentWarn);
  const { data: unpaid } = await supabaseAdmin
    .from('member_memberships')
    .select('id, member_id, end_date, users!member_id(name)')
    .eq('paid', false)
    .lte('end_date', paymentDate.toISOString().slice(0, 10));

  for (const m of unpaid || []) {
    toInsert.push({
      type: 'payment_overdue', entity_type: 'member', entity_id: m.member_id,
      message: `${m.users?.name} has an unpaid membership (due ${m.end_date}).`,
    });
  }

  // ── Freezes ending soon ────────────────────────────────────
  const freezeDate = new Date();
  freezeDate.setDate(freezeDate.getDate() + freezeWarn);
  const { data: freezes } = await supabaseAdmin
    .from('membership_freezes')
    .select('id, member_id, freeze_end, users!member_id(name)')
    .gt('freeze_end', now)
    .lte('freeze_end', freezeDate.toISOString().slice(0, 10));

  for (const f of freezes || []) {
    toInsert.push({
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
    toInsert.push({
      type: 'equipment_service_due', entity_type: 'equipment', entity_id: e.id,
      message: `${e.name} is due for service on ${e.next_service_due}.`,
    });
  }

  // ── Equipment out of order ─────────────────────────────────
  const { data: outOfOrder } = await supabaseAdmin
    .from('equipment').select('id, name').eq('status', 'out_of_order');

  for (const e of outOfOrder || []) {
    toInsert.push({
      type: 'equipment_out_of_order', entity_type: 'equipment', entity_id: e.id,
      message: `${e.name} is currently out of order.`,
    });
  }

  // ── Deduplicate and insert ─────────────────────────────────
  for (const notification of toInsert) {
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('type', notification.type)
      .eq('entity_id', notification.entity_id)
      .in('status', ['active', 'seen'])
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('notifications').insert(notification);
    }
  }
}

// ── Dismiss notification ──────────────────────────────────────
export async function dismissNotificationAction(notificationId) {
  const admin = await requireAdmin();

  await supabaseAdmin.from('notifications').update({
    status: 'dismissed',
    dismissed_by: admin.id,
    dismissed_at: new Date().toISOString(),
  }).eq('id', notificationId);

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
}

// ── Mark notification as seen ─────────────────────────────────
export async function markSeenAction(notificationId) {
  await supabaseAdmin.from('notifications').update({
    status: 'seen', seen_at: new Date().toISOString(),
  }).eq('id', notificationId).eq('status', 'active');

  revalidatePath('/notifications');
}

// ── Resolve notification ──────────────────────────────────────
export async function resolveNotificationAction(notificationId) {
  await supabaseAdmin.from('notifications').update({
    status: 'resolved', resolved_at: new Date().toISOString(),
  }).eq('id', notificationId);

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
}
