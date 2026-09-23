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
import { DATA_CHANGE_EVENT, readAllSyncable } from './bundle';

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'saved' | 'error';

const DEBOUNCE_MS = 800;

export function useSyncedProgress(trackId: string = DEFAULT_TRACK) {
  const { ready, user } = useAuth();

  const [data, setData] = useState<ProgressBlob | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialSyncDone = useRef(false);

  // Initial migration / load on auth ready
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      isInitialSyncDone.current = false;
      setHydrated(true);
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
        isInitialSyncDone.current = true;
        setHydrated(true);
        setStatus('idle');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Sync failed');
        setStatus('error');
        setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, trackId]);

  // Debounced save scheduler
  const scheduleSave = useCallback(() => {
    if (!user || !isInitialSyncDone.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus('syncing');
      try {
        const currentBundle = readAllSyncable();
        await saveServerProgress(user.id, currentBundle, trackId);
        setStatus('saved');
        setError(null);
        setTimeout(() => setStatus('idle'), 2000);
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    }, DEBOUNCE_MS);
  }, [user, trackId]);

  // Listen for internal app data change events
  useEffect(() => {
    const handleDataChange = () => {
      scheduleSave();
    };

    window.addEventListener(DATA_CHANGE_EVENT, handleDataChange);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleDataChange);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [scheduleSave]);

  const update = useCallback(
    (next: ProgressBlob) => {
      setData(next);
      writeLocalProgress(next);
      scheduleSave();
    },
    [scheduleSave],
  );

  const pull = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    try {
      const result = await migrateLocalStorage(user.id, trackId);
      setData(result.data ?? readLocalProgress());
      setStatus('saved');
      setError(null);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Pull failed');
    }
  }, [user, trackId]);

  const push = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    try {
      const currentBundle = readAllSyncable();
      await saveServerProgress(user.id, currentBundle, trackId);
      setStatus('saved');
      setError(null);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Push failed');
    }
  }, [user, trackId]);

  return { data, update, pull, push, status, error, hydrated };
}