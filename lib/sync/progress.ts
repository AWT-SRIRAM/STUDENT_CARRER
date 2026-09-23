'use client';

import { getSupabase } from '@/lib/supabase/client';
import {
  readAllSyncable,
  writeAllSyncable,
  hasAnyLocalData,
  type SyncBundle,
} from './bundle';

export const DEFAULT_TRACK = 'tnpsc';

export type ProgressBlob = SyncBundle;

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

/**
 * Migration strategy on user sign-in:
 * 1. If server row has progress data -> Pull from server, overwrite local storage.
 * 2. If server row is empty AND local data exists -> Push local data up to server.
 * 3. Otherwise -> No change.
 */
export async function migrateLocalStorage(
  userId: string,
  trackId: string = DEFAULT_TRACK,
): Promise<MigrationResult> {
  const server = await loadServerProgress(userId, trackId);
  const serverHasData =
    server &&
    server.data &&
    typeof server.data === 'object' &&
    Object.keys(server.data).length > 0;

  if (serverHasData) {
    writeAllSyncable(server.data);
    return { direction: 'pulled', data: server.data };
  }

  if (hasAnyLocalData()) {
    const local = readAllSyncable();
    await saveServerProgress(userId, local, trackId);
    return { direction: 'pushed', data: local };
  }

  return { direction: 'none', data: null };
}

export function readLocalProgress(): ProgressBlob {
  return readAllSyncable();
}

export function writeLocalProgress(data: ProgressBlob): void {
  writeAllSyncable(data);
}