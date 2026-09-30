import bcrypt from 'bcryptjs';

// ── Password ──────────────────────────────────────────────────

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Date helpers ──────────────────────────────────────────────

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0, 10)}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ── String helpers ────────────────────────────────────────────

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '_');
}

// ── Number helpers ────────────────────────────────────────────

export function formatCurrency(amount, currency = 'ETB') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Audit logging ─────────────────────────────────────────────

export async function writeAuditLog(supabaseClient, { action, entityType, entityId, performedBy, oldValue, newValue }) {
  await supabaseClient.from('audit_logs').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    performed_by: performedBy,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}
