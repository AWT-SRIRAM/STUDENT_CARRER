'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  DEFAULT_TRACK,
  migrateLocalStorage,
  readLocalProgress,
  saveServerProgress,
  writeLocalProgress,
  type ProgressBlob,
} from './progress';

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'error';

const DEBOUNCE_MS = 500;

export function useSyncedProgress(trackId: string = DEFAULT_TRACK) {
  const { ready, user } = useAuth();

  const [data, setData] = useState<ProgressBlob | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      hydrated.current = false;
      return;
    }
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const result = await migrateLocalStorage(user.id, trackId);
        if (cancelled) return;
        setData(result.data ?? readLocalProgress());
        hydrated.current = true;
        setStatus('idle');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Sync failed');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, trackId]);

  const update = useCallback(
    (next: ProgressBlob) => {
      setData(next);
      writeLocalProgress(next);

      if (!user) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setStatus('syncing');
        try {
          await saveServerProgress(user.id, next, trackId);
          setStatus('idle');
          setError(null);
        } catch (e) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'Save failed');
        }
      }, DEBOUNCE_MS);
    },
    [user, trackId],
  );

  const pull = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    try {
      const result = await migrateLocalStorage(user.id, trackId);
      setData(result.data ?? readLocalProgress());
      setStatus('idle');
      setError(null);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Pull failed');
    }
  }, [user, trackId]);

  return { data, update, pull, status, error };
}