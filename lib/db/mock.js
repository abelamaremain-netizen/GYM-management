/**
 * MOCK DATA LAYER
 * ───────────────
 * Returns realistic fake data that mirrors the exact shape of Supabase query
 * results. Every function here has an identical counterpart in supabase.js.
 *
 * To revert to real data: open lib/db/index.js and flip DEMO_MODE to false
 * (or remove NEXT_PUBLIC_DEMO_MODE=true from .env.local).
 *
 * Shape rules:
 * - Foreign key joins use the same nested object names as Supabase
 *   (e.g. users!member_id → { users: { id, name, status } })
 * - Dates are ISO strings (YYYY-MM-DD)
 * - UUIDs are fake but consistent across related records
 */

import { addDays, today } from '../utils';

// ── Stable fake IDs ───────────────────────────────────────────
const IDS = {
  admin1:       'a0000000-0000-0000-0000-000000000001',
  admin2:       'a0000000-0000-0000-0000-000000000002',
  instructor1:  'i0000000-0000-0000-0000-000000000001',
  instructor2:  'i0000000-0000-0000-0000-000000000002',
  instructor3:  'i0000000-0000-0000-0000-000000000003',
  member1:      'm0000000-0000-0000-0000-000000000001',
  member2:      'm0000000-0000-0000-0000-000000000002',
  member3:      'm0000000-0000-0000-0000-000000000003',
  member4:      'm0000000-0000-0000-0000-000000000004',
  member5:      'm0000000-0000-0000-0000-000000000005',
  member6:      'm0000000-0000-0000-0000-000000000006',
  plan1:        'p0000000-0000-0000-0000-000000000001',
  plan2:        'p0000000-0000-0000-0000-000000000002',
  plan3:        'p0000000-0000-0000-0000-000000000003',
  mem1:         'mm000000-0000-0000-0000-000000000001',
  mem2:         'mm000000-0000-0000-0000-000000000002',
  mem3:         'mm000000-0000-0000-0000-000000000003',
  mem4:         'mm000000-0000-0000-0000-000000000004',
  mem5:         'mm000000-0000-0000-0000-000000000005',
  mem6:         'mm000000-0000-0000-0000-000000000006',
  equip1:       'e0000000-0000-0000-0000-000000000001',
  equip2:       'e0000000-0000-0000-0000-000000000002',
  equip3:       'e0000000-0000-0000-0000-000000000003',
  equip4:       'e0000000-0000-0000-0000-000000000004',
  notif1:       'n0000000-0000-0000-0000-000000000001',
  notif2:       'n0000000-0000-0000-0000-000000000002',
  notif3:       'n0000000-0000-0000-0000-000000000003',
};

const T = today();
const YESTERDAY    = addDays(T, -1);
const LAST_WEEK    = addDays(T, -7);
const LAST_MONTH   = addDays(T, -30);
const THREE_MONTHS = addDays(T, -90);
const IN_5_DAYS    = addDays(T, 5);
const IN_20_DAYS   = addDays(T, 20);
const IN_60_DAYS   = addDays(T, 60);
const IN_90_DAYS   = addDays(T, 90);

// ── Raw data stores ───────────────────────────────────────────

const MEMBERS = [
  {
    id: IDS.member1, name: 'Abebe Bekele', email: 'abebe@email.com',
    phone: '+251 911 234 567', role: 'member', status: 'active',
    created_at: THREE_MONTHS,
    member_profiles: [{ date_of_birth: '1992-04-10', gender: 'male', emergency_contact_name: 'Tigist Bekele', emergency_contact_phone: '+251 911 000 001', health_notes: null, joined_at: THREE_MONTHS }],
    member_memberships: [{ id: IDS.mem1, plan_name: 'Monthly', plan_duration_days: 30, original_price: 500, discount_amount: 0, final_price: 500, start_date: LAST_MONTH, end_date: IN_5_DAYS, paid: true, paid_date: LAST_MONTH, grace_until: null, notes: null, created_at: LAST_MONTH }],
  },
  {
    id: IDS.member2, name: 'Tigist Alemu', email: 'tigist@email.com',
    phone: '+251 922 345 678', role: 'member', status: 'active',
    created_at: addDays(T, -60),
    member_profiles: [{ date_of_birth: '1995-08-22', gender: 'female', emergency_contact_name: 'Alemu Tadesse', emergency_contact_phone: '+251 922 000 002', health_notes: 'Mild asthma', joined_at: addDays(T, -60) }],
    member_memberships: [{ id: IDS.mem2, plan_name: 'Quarterly', plan_duration_days: 90, original_price: 1200, discount_amount: 100, final_price: 1100, start_date: addDays(T, -60), end_date: IN_30_DAYS(), paid: true, paid_date: addDays(T, -60), grace_until: null, notes: 'Long-term member', created_at: addDays(T, -60) }],
  },
  {
    id: IDS.member3, name: 'Dawit Haile', email: 'dawit@email.com',
    phone: '+251 933 456 789', role: 'member', status: 'frozen',
    created_at: addDays(T, -45),
    member_profiles: [{ date_of_birth: '1988-01-15', gender: 'male', emergency_contact_name: 'Haile Girma', emergency_contact_phone: '+251 933 000 003', health_notes: 'Knee injury — avoid high impact', joined_at: addDays(T, -45) }],
    member_memberships: [{ id: IDS.mem3, plan_name: 'Monthly', plan_duration_days: 30, original_price: 500, discount_amount: 0, final_price: 500, start_date: addDays(T, -45), end_date: IN_20_DAYS, paid: true, paid_date: addDays(T, -45), grace_until: null, notes: null, created_at: addDays(T, -45) }],
  },
  {
    id: IDS.member4, name: 'Sara Tesfaye', email: 'sara@email.com',
    phone: '+251 944 567 890', role: 'member', status: 'expired',
    created_at: addDays(T, -95),
    member_profiles: [{ date_of_birth: '1998-11-30', gender: 'female', emergency_contact_name: 'Tesfaye Mamo', emergency_contact_phone: '+251 944 000 004', health_notes: null, joined_at: addDays(T, -95) }],
    member_memberships: [{ id: IDS.mem4, plan_name: 'Monthly', plan_duration_days: 30, original_price: 500, discount_amount: 0, final_price: 500, start_date: addDays(T, -95), end_date: LAST_WEEK, paid: true, paid_date: addDays(T, -95), grace_until: null, notes: null, created_at: addDays(T, -95) }],
  },
  {
    id: IDS.member5, name: 'Kebede Worku', email: 'kebede@email.com',
    phone: '+251 955 678 901', role: 'member', status: 'active',
    created_at: addDays(T, -15),
    member_profiles: [{ date_of_birth: '2000-06-05', gender: 'male', emergency_contact_name: 'Worku Lemma', emergency_contact_phone: '+251 955 000 005', health_notes: null, joined_at: addDays(T, -15) }],
    member_memberships: [{ id: IDS.mem5, plan_name: 'Monthly', plan_duration_days: 30, original_price: 500, discount_amount: 0, final_price: 500, start_date: addDays(T, -15), end_date: IN_20_DAYS, paid: false, paid_date: null, grace_until: null, notes: null, created_at: addDays(T, -15) }],
  },
  {
    id: IDS.member6, name: 'Meron Tadesse', email: null,
    phone: '+251 966 789 012', role: 'member', status: 'active',
    created_at: addDays(T, -5),
    member_profiles: [{ date_of_birth: '1993-03-18', gender: 'female', emergency_contact_name: 'Tadesse Girma', emergency_contact_phone: '+251 966 000 006', health_notes: null, joined_at: addDays(T, -5) }],
    member_memberships: [{ id: IDS.mem6, plan_name: 'Annual', plan_duration_days: 365, original_price: 5000, discount_amount: 500, final_price: 4500, start_date: addDays(T, -5), end_date: IN_90_DAYS, paid: true, paid_date: addDays(T, -5), grace_until: null, notes: null, created_at: addDays(T, -5) }],
  },
];

function IN_30_DAYS() { return addDays(T, 30); }

const INSTRUCTORS = [
  {
    id: IDS.instructor1, name: 'Marcus Girma', email: 'marcus@gym.com',
    phone: '+251 911 100 001', role: 'instructor', status: 'active',
    created_at: addDays(T, -200),
    instructor_profiles: [{ specialization: 'Strength & Conditioning', hourly_rate: 150, contract_type: 'full_time', joined_staff_at: addDays(T, -200) }],
  },
  {
    id: IDS.instructor2, name: 'Hana Solomon', email: 'hana@gym.com',
    phone: '+251 922 200 002', role: 'instructor', status: 'active',
    created_at: addDays(T, -120),
    instructor_profiles: [{ specialization: 'Cardio & Endurance', hourly_rate: 120, contract_type: 'part_time', joined_staff_at: addDays(T, -120) }],
  },
  {
    id: IDS.instructor3, name: 'Yonas Tefera', email: 'yonas@gym.com',
    phone: '+251 933 300 003', role: 'instructor', status: 'deleted',
    created_at: addDays(T, -300),
    instructor_profiles: [{ specialization: 'CrossFit', hourly_rate: 130, contract_type: 'freelance', joined_staff_at: addDays(T, -300) }],
  },
];

const PLANS = [
  { id: IDS.plan1, name: 'Monthly',   duration_days: 30,  original_price: 500,  discount_amount: 0,   final_price: 500,  is_active: true,  created_by: IDS.admin1, created_at: addDays(T, -180) },
  { id: IDS.plan2, name: 'Quarterly', duration_days: 90,  original_price: 1350, discount_amount: 150, final_price: 1200, is_active: true,  created_by: IDS.admin1, created_at: addDays(T, -180) },
  { id: IDS.plan3, name: 'Annual',    duration_days: 365, original_price: 5500, discount_amount: 1000, final_price: 4500, is_active: true, created_by: IDS.admin1, created_at: addDays(T, -180) },
];

const MEMBERSHIPS = [
  { id: IDS.mem1, member_id: IDS.member1, plan_id: IDS.plan1, plan_name: 'Monthly',   plan_duration_days: 30,  original_price: 500,  discount_amount: 0,   final_price: 500,  start_date: LAST_MONTH, end_date: IN_5_DAYS,   paid: true,  paid_date: LAST_MONTH,      grace_until: null, notes: null,             created_by: IDS.admin1, created_at: LAST_MONTH,      users: { id: IDS.member1, name: 'Abebe Bekele',  status: 'active'  } },
  { id: IDS.mem2, member_id: IDS.member2, plan_id: IDS.plan2, plan_name: 'Quarterly', plan_duration_days: 90,  original_price: 1200, discount_amount: 100, final_price: 1100, start_date: addDays(T, -60), end_date: IN_30_DAYS(), paid: true,  paid_date: addDays(T, -60), grace_until: null, notes: 'Long-term member', created_by: IDS.admin1, created_at: addDays(T, -60), users: { id: IDS.member2, name: 'Tigist Alemu',  status: 'active'  } },
  { id: IDS.mem3, member_id: IDS.member3, plan_id: IDS.plan1, plan_name: 'Monthly',   plan_duration_days: 30,  original_price: 500,  discount_amount: 0,   final_price: 500,  start_date: addDays(T, -45), end_date: IN_20_DAYS,  paid: true,  paid_date: addDays(T, -45), grace_until: null, notes: null,             created_by: IDS.admin1, created_at: addDays(T, -45), users: { id: IDS.member3, name: 'Dawit Haile',   status: 'frozen'  } },
  { id: IDS.mem4, member_id: IDS.member4, plan_id: IDS.plan1, plan_name: 'Monthly',   plan_duration_days: 30,  original_price: 500,  discount_amount: 0,   final_price: 500,  start_date: addDays(T, -95), end_date: LAST_WEEK,   paid: true,  paid_date: addDays(T, -95), grace_until: null, notes: null,             created_by: IDS.admin1, created_at: addDays(T, -95), users: { id: IDS.member4, name: 'Sara Tesfaye',  status: 'expired' } },
  { id: IDS.mem5, member_id: IDS.member5, plan_id: IDS.plan1, plan_name: 'Monthly',   plan_duration_days: 30,  original_price: 500,  discount_amount: 0,   final_price: 500,  start_date: addDays(T, -15), end_date: IN_20_DAYS,  paid: false, paid_date: null,            grace_until: null, notes: null,             created_by: IDS.admin1, created_at: addDays(T, -15), users: { id: IDS.member5, name: 'Kebede Worku',  status: 'active'  } },
  { id: IDS.mem6, member_id: IDS.member6, plan_id: IDS.plan3, plan_name: 'Annual',    plan_duration_days: 365, original_price: 5000, discount_amount: 500, final_price: 4500, start_date: addDays(T, -5),  end_date: IN_90_DAYS,  paid: true,  paid_date: addDays(T, -5),  grace_until: null, notes: null,             created_by: IDS.admin1, created_at: addDays(T, -5),  users: { id: IDS.member6, name: 'Meron Tadesse', status: 'active'  } },
];

const EQUIPMENT = [
  { id: IDS.equip1, name: 'Treadmill 1',      category: 'Cardio',       serial_number: 'TM-001', purchase_date: addDays(T, -365), status: 'operational',   last_serviced: addDays(T, -10), next_service_due: addDays(T, 20),  notes: null,             created_by: IDS.admin1, created_at: addDays(T, -365), retired_at: null },
  { id: IDS.equip2, name: 'Rowing Machine',   category: 'Cardio',       serial_number: 'RM-001', purchase_date: addDays(T, -200), status: 'out_of_order',  last_serviced: addDays(T, -60), next_service_due: addDays(T, -30), notes: 'Handle cracked', created_by: IDS.admin1, created_at: addDays(T, -200), retired_at: null },
  { id: IDS.equip3, name: 'Barbell Set 20kg', category: 'Free Weights', serial_number: null,      purchase_date: addDays(T, -400), status: 'operational',   last_serviced: addDays(T, -5),  next_service_due: addDays(T, 25),  notes: null,             created_by: IDS.admin1, created_at: addDays(T, -400), retired_at: null },
  { id: IDS.equip4, name: 'Cable Machine',    category: 'Machines',     serial_number: 'CM-002', purchase_date: addDays(T, -180), status: 'needs_service', last_serviced: addDays(T, -35), next_service_due: addDays(T, -5),  notes: 'Pulley worn',  created_by: IDS.admin1, created_at: addDays(T, -180), retired_at: null },
];

const NOTIFICATIONS = [
  { id: IDS.notif1, type: 'membership_expiring', entity_type: 'member', entity_id: IDS.member1, message: "Abebe Bekele's membership expires in 5 days.", status: 'active', generated_at: YESTERDAY, seen_at: null, dismissed_by: null, dismissed_at: null, resolved_at: null, users: null },
  { id: IDS.notif2, type: 'payment_overdue',     entity_type: 'member', entity_id: IDS.member5, message: "Kebede Worku has an unpaid membership (due " + IN_20_DAYS + ").", status: 'active', generated_at: YESTERDAY, seen_at: null, dismissed_by: null, dismissed_at: null, resolved_at: null, users: null },
  { id: IDS.notif3, type: 'equipment_out_of_order', entity_type: 'equipment', entity_id: IDS.equip2, message: 'Rowing Machine is currently out of order.', status: 'active', generated_at: YESTERDAY, seen_at: null, dismissed_by: null, dismissed_at: null, resolved_at: null, users: null },
];

const CONFIGURATIONS = [
  { id: 'cfg-001', key: 'membership_expiry_warning_days',    value: '7',    type: 'integer', label: 'Membership Expiry Warning (days)',     description: 'Days before expiry to show warning', group_name: 'membership', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-002', key: 'payment_due_warning_days',          value: '3',    type: 'integer', label: 'Payment Due Warning (days)',            description: 'Days before end date to flag unpaid', group_name: 'membership', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-003', key: 'freeze_max_days',                   value: '30',   type: 'integer', label: 'Maximum Freeze Duration (days)',        description: 'Max days a membership can be frozen', group_name: 'membership', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-004', key: 'freeze_ending_warning_days',        value: '3',    type: 'integer', label: 'Freeze Ending Warning (days)',          description: 'Days before freeze end to notify', group_name: 'membership', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-005', key: 'equipment_service_interval_days',   value: '30',   type: 'integer', label: 'Equipment Service Interval (days)',     description: 'Days between routine services', group_name: 'equipment', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-006', key: 'equipment_service_due_warning_days',value: '7',    type: 'integer', label: 'Equipment Service Due Warning (days)',  description: 'Days before service due to warn', group_name: 'equipment', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-007', key: 'equipment_categories',              value: 'Cardio,Free Weights,Machines,Accessories,Furniture', type: 'string', label: 'Equipment Categories', description: 'Comma-separated allowed categories', group_name: 'equipment', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-008', key: 'admin_session_duration_hours',      value: '8',    type: 'integer', label: 'Admin Session Duration (hours)',        description: 'How long a session stays valid', group_name: 'system', updated_by: null, updated_at: T, users: null },
  { id: 'cfg-009', key: 'currency_code',                     value: 'ETB',  type: 'string',  label: 'Currency Code',                        description: 'ISO 4217 currency code (e.g. ETB, USD)', group_name: 'system', updated_by: null, updated_at: T, users: null },
];

const AUDIT_LOGS = [
  { id: 'al-001', action: 'member_created',   entity_type: 'member',    entity_id: IDS.member1, performed_by: IDS.admin1, old_value: null, new_value: { name: 'Abebe Bekele' },  created_at: THREE_MONTHS },
  { id: 'al-002', action: 'membership_assigned', entity_type: 'membership', entity_id: IDS.member1, performed_by: IDS.admin1, old_value: null, new_value: { plan_name: 'Monthly' }, created_at: LAST_MONTH },
  { id: 'al-003', action: 'member_frozen',    entity_type: 'member',    entity_id: IDS.member3, performed_by: IDS.admin1, old_value: null, new_value: { reason: 'Travel' },       created_at: addDays(T, -10) },
  { id: 'al-004', action: 'equipment_status_changed', entity_type: 'equipment', entity_id: IDS.equip2, performed_by: IDS.admin1, old_value: { status: 'operational' }, new_value: { status: 'out_of_order' }, created_at: YESTERDAY },
];

// ── Helper: filter by status ──────────────────────────────────
function filterByStatus(arr, status) {
  if (!status || status === 'all') return arr.filter((m) => m.status !== 'deleted');
  return arr.filter((m) => m.status === status);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED DATA FUNCTIONS
// Each mirrors what pages currently do with supabaseAdmin queries.
// When Supabase is connected, lib/db/index.js routes to supabase.js instead.
// ═══════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────────
export function getDashboardStats() {
  const members = MEMBERS.filter((m) => m.role === 'member');
  const revenueThisMonth = MEMBERSHIPS
    .filter((m) => m.paid && m.paid_date >= addDays(T, -30))
    .reduce((s, m) => s + m.final_price, 0);

  return {
    totalMembers:      members.filter((m) => m.status !== 'deleted').length,
    activeMembers:     members.filter((m) => m.status === 'active').length,
    frozenMembers:     members.filter((m) => m.status === 'frozen').length,
    expiredMembers:    members.filter((m) => m.status === 'expired').length,
    activeInstructors: INSTRUCTORS.filter((i) => i.status === 'active').length,
    revenueThisMonth,
    notificationCount: NOTIFICATIONS.filter((n) => n.status === 'active').length,
    expiringMemberships: MEMBERSHIPS.filter((m) => m.end_date > T && m.end_date <= addDays(T, 7)).slice(0, 5),
    unpaidMemberships:   MEMBERSHIPS.filter((m) => !m.paid && m.end_date >= T && m.end_date <= addDays(T, 3)).slice(0, 5),
    equipmentAlerts:     EQUIPMENT.filter((e) => ['out_of_order', 'needs_service'].includes(e.status)).slice(0, 5),
    recentMembers:       [...MEMBERS].filter((m) => m.status !== 'deleted').sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
  };
}

// ── Members ───────────────────────────────────────────────────
export function getMembers({ status, search } = {}) {
  let list = [...MEMBERS];
  if (status && status !== 'all') {
    list = list.filter((m) => m.status === status);
  } else {
    list = list.filter((m) => m.status !== 'deleted');
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getMemberById(id) {
  const member = MEMBERS.find((m) => m.id === id);
  if (!member) return null;
  return {
    ...member,
    member_memberships: MEMBERSHIPS.filter((m) => m.member_id === id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date)),
  };
}

export function getMemberFreezeHistory(memberId) {
  // No freeze data in mock — return empty for now
  return [];
}

// ── Instructors ───────────────────────────────────────────────
export function getInstructors({ showDeleted = false } = {}) {
  return INSTRUCTORS.filter((i) =>
    showDeleted ? i.status === 'deleted' : i.status !== 'deleted'
  );
}

// ── Plans ─────────────────────────────────────────────────────
export function getPlans() {
  return PLANS;
}

export function getActivePlans() {
  return PLANS.filter((p) => p.is_active);
}

// ── Memberships ───────────────────────────────────────────────
export function getMemberships({ filter = 'all', page = 1, pageSize = 50 } = {}) {
  let list = [...MEMBERSHIPS];
  if (filter === 'paid')   list = list.filter((m) => m.paid);
  if (filter === 'unpaid') list = list.filter((m) => !m.paid);
  const total = list.length;
  const data  = list.slice((page - 1) * pageSize, page * pageSize);
  return { data, total };
}

// ── Equipment ─────────────────────────────────────────────────
export function getEquipment({ status, category } = {}) {
  let list = [...EQUIPMENT];
  if (status && status !== 'all') list = list.filter((e) => e.status === status);
  if (category) list = list.filter((e) => e.category === category);
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function getEquipmentCategories() {
  const cfg = CONFIGURATIONS.find((c) => c.key === 'equipment_categories');
  return cfg ? cfg.value.split(',').map((c) => c.trim()) : [];
}

export function getEquipmentMaintenanceLogs(equipmentId) {
  return []; // no mock maintenance logs
}

// ── Notifications ─────────────────────────────────────────────
export function getNotifications({ filter = 'active' } = {}) {
  let list = [...NOTIFICATIONS];
  if (filter === 'active')    list = list.filter((n) => ['active', 'seen'].includes(n.status));
  if (filter === 'dismissed') list = list.filter((n) => n.status === 'dismissed');
  if (filter === 'resolved')  list = list.filter((n) => n.status === 'resolved');
  if (filter === 'all')       list = list;
  return list;
}

// ── Configurations ────────────────────────────────────────────
export function getConfigurations() {
  const grouped = CONFIGURATIONS.reduce((acc, c) => {
    if (!acc[c.group_name]) acc[c.group_name] = [];
    acc[c.group_name].push(c);
    return acc;
  }, {});
  return grouped;
}

// ── Reports ───────────────────────────────────────────────────
export function getReportData() {
  const members = MEMBERS.filter((m) => m.role === 'member');
  const firstOfMonth = addDays(T, -(new Date().getDate() - 1));
  const firstOfYear  = `${new Date().getFullYear()}-01-01`;

  const revenueThisMonth = MEMBERSHIPS
    .filter((m) => m.paid && m.paid_date >= firstOfMonth)
    .reduce((s, m) => s + m.final_price, 0);
  const revenueThisYear  = MEMBERSHIPS
    .filter((m) => m.paid && m.paid_date >= firstOfYear)
    .reduce((s, m) => s + m.final_price, 0);
  const outstanding = MEMBERSHIPS
    .filter((m) => !m.paid)
    .reduce((s, m) => s + m.final_price, 0);

  const planCounts = MEMBERSHIPS
    .filter((m) => m.paid)
    .reduce((acc, m) => { acc[m.plan_name] = (acc[m.plan_name] || 0) + 1; return acc; }, {});

  const recentPayments = MEMBERSHIPS
    .filter((m) => m.paid)
    .sort((a, b) => b.paid_date.localeCompare(a.paid_date))
    .slice(0, 10);

  return {
    members: {
      total:        members.length,
      active:       members.filter((m) => m.status === 'active').length,
      frozen:       members.filter((m) => m.status === 'frozen').length,
      expired:      members.filter((m) => m.status === 'expired').length,
      deleted:      members.filter((m) => m.status === 'deleted').length,
      newThisMonth: members.filter((m) => m.created_at >= firstOfMonth).length,
    },
    instructors: { total: INSTRUCTORS.filter((i) => i.status !== 'deleted').length },
    revenue: { thisMonth: revenueThisMonth, thisYear: revenueThisYear, outstanding },
    planCounts,
    recentPayments: recentPayments.map((m) => ({
      ...m,
      users: { name: MEMBERS.find((mb) => mb.id === m.member_id)?.name },
    })),
  };
}

// ── Audit logs ────────────────────────────────────────────────
export function getAuditLogs() {
  return AUDIT_LOGS;
}
