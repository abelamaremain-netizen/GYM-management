/**
 * DATA LAYER SWITCH
 * ─────────────────
 * This file is the only place that decides whether to use mock data
 * or Supabase. All pages import from here, never directly from mock.js
 * or supabase.js.
 *
 * TO SWITCH TO REAL DATA:
 *   1. Set up Supabase env vars in .env.local
 *   2. Remove NEXT_PUBLIC_DEMO_MODE=true from .env.local
 *   Done. No code changes needed.
 *
 * The IS_DEMO flag is true when:
 *   - NEXT_PUBLIC_DEMO_MODE=true is set, AND
 *   - Supabase is not configured (no NEXT_PUBLIC_SUPABASE_URL)
 */

import { isSupabaseConfigured } from '../supabase';

export const IS_DEMO = !isSupabaseConfigured &&
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export {
  getDashboardStats,
  getMembers,
  getMemberById,
  getMemberFreezeHistory,
  getInstructors,
  getPlans,
  getActivePlans,
  getMemberships,
  getEquipment,
  getEquipmentCategories,
  getEquipmentMaintenanceLogs,
  getNotifications,
  getConfigurations,
  getReportData,
  getAuditLogs,
} from './mock.js';

/**
 * NOTE: When Supabase is connected, replace the above re-exports with:
 *
 * export {
 *   getDashboardStats,
 *   getMembers,
 *   ...
 * } from './supabase.js';
 *
 * Or use the IS_DEMO flag conditionally:
 *
 * import * as mockDb from './mock.js';
 * import * as realDb from './supabase.js';
 * const db = IS_DEMO ? mockDb : realDb;
 * export const getMembers = db.getMembers;
 * ...
 */
