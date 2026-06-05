// Field reader — across-user buried seals.
//
// Pattern: each user's save (via useGameSave) is a SealSave object
// containing their `seals` array. `get/data/list` returns the 6 most
// recent users' latest saves for this session, so we flatten across
// them to build the public Field feed.
//
// Memory rule (throttle-at-input): don't cap input — flatten all
// seals from all returned users, then sort newest first, then cap
// display count. Don't drop entries silently at the data layer.

import { useEffect, useMemo, useState } from 'react';
import { callAigramAPI, type AigramResponse } from '@shared/runtime/bridge';
import { getGameUuid } from '@shared/runtime/game-id';
import type { Seal, SealSave } from '../types';

interface SaveRow {
  user_id: string;
  time: string;
  resource_data: string;
}

interface ProfileData {
  name?: string;
  head_url?: string;
}

export interface FieldEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  seal: Seal;
}

interface UseFieldResult {
  entries: FieldEntry[];
  loaded: boolean;
  refresh: () => Promise<void>;
  /** Optimistically show a just-buried seal in the feed immediately,
   *  bridging the platform save → get/data/list replication lag. The next
   *  refresh dedupes it once the server reflects the write. */
  injectLocal: (entry: FieldEntry) => void;
  /** Drop an optimistic entry (e.g. the user discards it same-session). */
  removeLocal: (sealId: string) => void;
}

const MAX_DISPLAY = 60;

export function useField(): UseFieldResult {
  const [serverEntries, setServerEntries] = useState<FieldEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<FieldEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sessionId = getGameUuid();

  // Merge optimistic-local + server, dedupe by seal.id (server wins),
  // newest first, capped at display count.
  const entries = useMemo(() => {
    const seen = new Set<string>();
    const merged: FieldEntry[] = [];
    for (const e of [...serverEntries, ...localEntries]) {
      if (seen.has(e.seal.id)) continue;
      seen.add(e.seal.id);
      merged.push(e);
    }
    merged.sort((a, b) => (b.seal.ts ?? 0) - (a.seal.ts ?? 0));
    return merged.slice(0, MAX_DISPLAY);
  }, [serverEntries, localEntries]);

  const injectLocal = (entry: FieldEntry) => {
    setLocalEntries(prev =>
      prev.some(e => e.seal.id === entry.seal.id) ? prev : [entry, ...prev]);
  };

  const removeLocal = (sealId: string) => {
    setLocalEntries(prev => prev.filter(e => e.seal.id !== sealId));
  };

  const refresh = async () => {
    if (!sessionId) { setServerEntries([]); setLoaded(true); return; }
    setLoaded(false);
    try {
      const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows: SaveRow[] = Array.isArray(res?.data) ? res.data : [];

      // Flatten ALL buried seals from ALL returned users (don't cap at
      // the data layer — that's the throttle-at-input anti-pattern).
      const pairs: Array<{ userId: string; seal: Seal }> = [];
      for (const row of rows) {
        if (!row.user_id || !row.resource_data) continue;
        try {
          const save = JSON.parse(row.resource_data) as SealSave;
          for (const seal of save.seals || []) {
            if (seal && seal.imageUrl) {
              pairs.push({ userId: row.user_id, seal });
            }
          }
        } catch { /* skip corrupt row */ }
      }
      pairs.sort((a, b) => (b.seal.ts ?? 0) - (a.seal.ts ?? 0));
      const limited = pairs.slice(0, MAX_DISPLAY);

      // Resolve author profile per unique user.
      const uniqueIds = Array.from(new Set(limited.map(p => p.userId)));
      const profileEntries = await Promise.all(
        uniqueIds.map(async uid => {
          try {
            const r = await callAigramAPI<AigramResponse<ProfileData>>(
              `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(uid)}`,
              'GET',
            );
            return [uid, r?.data ?? null] as const;
          } catch {
            return [uid, null as ProfileData | null] as const;
          }
        }),
      );
      const profileMap = new Map<string, ProfileData | null>(profileEntries);

      setServerEntries(
        limited.map(({ userId, seal }) => {
          const p = profileMap.get(userId) || null;
          return {
            userId,
            userName: p?.name,
            userAvatarUrl: p?.head_url,
            seal,
          };
        }),
      );
    } catch {
      setServerEntries([]);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  return { entries, loaded, refresh, injectLocal, removeLocal };
}
