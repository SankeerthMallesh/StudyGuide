'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyStudyState, type StudyState } from '@/types/study';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const STORAGE_KEY = (userId?: string) => `studyflow.workspace.v1.${userId || 'guest'}`;
const SNAPSHOT_TABLE = 'studyflow_workspaces';

export function useStudyState(userId?: string) {
  const [state, setState] = useState<StudyState>(emptyStudyState);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'syncing' | 'offline'>('local');
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedKey = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const storageKey = userId || 'guest';
      hydratedKey.current = null;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      setHydrated(false);
      let localState = emptyStudyState();
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY(userId));
        if (raw) localState = { ...emptyStudyState(), ...JSON.parse(raw) };
      } catch { /* Start with an empty workspace if local data is corrupt. */ }
      if (!alive) return;
      const supabase = getSupabaseBrowserClient();
      if (supabase && userId) {
        setSyncStatus('syncing');
        const { data, error } = await supabase.from(SNAPSHOT_TABLE).select('data').eq('user_id', userId).maybeSingle();
        if (!alive) return;
        if (!error && data?.data) {
          const cloud = { ...emptyStudyState(), ...(data.data as Partial<StudyState>) };
          const hasCloud = Object.values(cloud).some((items) => Array.isArray(items) && items.length > 0);
          const hasLocal = Object.values(localState).some((items) => Array.isArray(items) && items.length > 0);
          const chosen = hasCloud ? cloud : localState;
          setState(chosen);
          try { window.localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(chosen)); } catch { /* Ignore storage quota. */ }
          setSyncStatus('synced');
          if (!hasCloud && hasLocal) {
            const save = await supabase.from(SNAPSHOT_TABLE).upsert({ user_id: userId, data: localState, updated_at: new Date().toISOString() });
            if (alive) setSyncStatus(save.error ? 'offline' : 'synced');
          }
        } else {
          setState(localState);
          setSyncStatus(error ? 'offline' : 'synced');
          const hasLocal = Object.values(localState).some((items) => Array.isArray(items) && items.length > 0);
          if (!error && hasLocal) {
            const save = await supabase.from(SNAPSHOT_TABLE).upsert({ user_id: userId, data: localState, updated_at: new Date().toISOString() });
            if (alive) setSyncStatus(save.error ? 'offline' : 'synced');
          }
        }
      } else {
        setState(localState);
        setSyncStatus('local');
      }

      if (alive) {
        hydratedKey.current = storageKey;
        setHydrated(true);
      }
    }
    load();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    if (!hydrated || hydratedKey.current !== (userId || 'guest')) return;
    try { window.localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(state)); } catch { /* Browser storage may be full or disabled. */ }
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) { setSyncStatus('local'); return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncStatus('syncing');
    syncTimer.current = setTimeout(async () => {
      const { error } = await supabase.from(SNAPSHOT_TABLE).upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() });
      setSyncStatus(error ? 'offline' : 'synced');
    }, 900);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state, hydrated, userId]);

  const update = useCallback((updater: (current: StudyState) => StudyState) => setState((current) => updater(current)), []);
  return { state, update, hydrated: hydrated && hydratedKey.current === (userId || 'guest'), syncStatus };
}
