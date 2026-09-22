'use client';

import { getSupabase } from '@/lib/supabase/client';

/**
 * CHANGE THESE TWO CONSTANTS to match your existing tracker.
 * LOCAL_KEY must be the localStorage key your tracker already uses.
 */
export const LOCAL_KEY = 'tnpsc-tracker:v1';
export const DEFAULT_TRACK = 'tnpsc';

export type ProgressBlob = Record<string, unknown>;

function readLocal(): ProgressBlob | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ProgressBlob) : null;
  } catch {
    return null;
  }
}

function writeLocal(data: ProgressBlob) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* quota errors are non-fatal */
  }
}

export async function loadServerProgress(
  userId: string,
  trackId: string = DEFAULT_TRACK,
): Promise<{ data: ProgressBlob; updated_at: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('progress')
    .select('data, updated_at')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();
  if (error) throw error;
  return data as { data: ProgressBlob; updated_at: string } | null;
}

export async function saveServerProgress(
  userId: string,
  data: ProgressBlob,
  trackId: string = DEFAULT_TRACK,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('progress').upsert(
    {
      user_id: userId,
      track_id: trackId,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,track_id' },
  );
  if (error) throw error;
}

export type MigrationResult = {
  direction: 'pushed' | 'pulled' | 'none';
  data: ProgressBlob | null;
};

export async function migrateLocalStorage(
  userId: string,
  trackId: string = DEFAULT_TRACK,
): Promise<MigrationResult> {
  const local = readLocal();
  const server = await loadServerProgress(userId, trackId);

  if (!server && local) {
    await saveServerProgress(userId, local, trackId);
    return { direction: 'pushed', data: local };
  }

  if (server) {
    writeLocal(server.data);
    return { direction: 'pulled', data: server.data };
  }

  return { direction: 'none', data: null };
}

export function readLocalProgress(): ProgressBlob | null {
  return readLocal();
}

export function writeLocalProgress(data: ProgressBlob): void {
  writeLocal(data);
}