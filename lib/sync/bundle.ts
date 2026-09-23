'use client';

export const SYNC_KEYS = [
  'tnpsc_progress_v2',
  'tnpsc_mocks',
  'tnpsc_streak',
  'tnpsc_last_date',
  'tnpsc_sick',
  'tnpsc_xp',
  'tnpsc_xp_date',
  'tnpsc_actions',
  'tnpsc_actions_date',
  'tnpsc_topics',
  'tnpsc_topics_date',
  'tnpsc_today_plan',
  'tnpsc_history',
  'tnpsc_goal_history',
  'tnpsc_onboarding',
  'tnpsc_daily_notes',
  'tnpsc_attempted_papers',
] as const;

export type SyncKey = (typeof SYNC_KEYS)[number];
export type SyncBundle = Record<string, unknown>;

export const DATA_CHANGE_EVENT = 'tnpsc:data_change';

/**
 * Dispatch a lightweight browser event to notify the sync manager
 * that syncable data has changed in localStorage.
 */
export function notifyDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
}

/**
 * Read all syncable localStorage keys into a single bundle object.
 * Values that are JSON strings will be parsed; simple strings/numbers remain intact.
 */
export function readAllSyncable(): SyncBundle {
  if (typeof window === 'undefined') return {};
  const bundle: SyncBundle = {};

  for (const key of SYNC_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          bundle[key] = JSON.parse(raw);
        } catch {
          bundle[key] = raw;
        }
      }
    } catch {
      // Ignore localStorage access errors
    }
  }

  return bundle;
}

/**
 * Write a bundle of syncable keys back into localStorage.
 */
export function writeAllSyncable(bundle: SyncBundle | null | undefined): void {
  if (typeof window === 'undefined' || !bundle || typeof bundle !== 'object') return;

  for (const key of SYNC_KEYS) {
    try {
      if (key in bundle) {
        const value = bundle[key];
        if (value === null || value === undefined) {
          window.localStorage.removeItem(key);
        } else if (typeof value === 'string') {
          window.localStorage.setItem(key, value);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch {
      // Storage quota or permissions error is non-fatal
    }
  }
}

/**
 * Check if the current browser's localStorage contains any meaningful tracker data.
 */
export function hasAnyLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  for (const key of SYNC_KEYS) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== '' && val !== '{}' && val !== '[]' && val !== '0') {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}
