import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {zustandStorage} from '@/services/storage';

const MAX_HISTORY = 50;

export interface WatchHistoryEntry {
  id: string;
  title: string;
  posterUrl?: string;
  type: 'movie' | 'series' | 'channel';
  /** Playback progress in seconds */
  progressSeconds: number;
  /** Total duration in seconds (0 = unknown / live) */
  durationSeconds: number;
  lastWatchedAt: number;
}

/** Watch history stored per-profile: { [profileId]: WatchHistoryEntry[] } */
export interface WatchHistoryState {
  byProfile: Record<string, WatchHistoryEntry[]>;
  upsertEntry: (profileId: string, entry: WatchHistoryEntry) => void;
  removeEntry: (profileId: string, entryId: string) => void;
  getHistory: (profileId: string) => WatchHistoryEntry[];
  getEntry: (profileId: string, entryId: string) => WatchHistoryEntry | undefined;
  clearHistory: (profileId: string) => void;
  removeProfileData: (profileId: string) => void;
}

export const useWatchHistoryStore = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      byProfile: {},

      upsertEntry: (profileId: string, entry: WatchHistoryEntry) =>
        set(state => {
          const list = state.byProfile[profileId] ?? [];
          const idx = list.findIndex(e => e.id === entry.id);
          let updated: WatchHistoryEntry[];
          if (idx >= 0) {
            updated = [...list];
            updated[idx] = entry;
            // Move to front
            const [moved] = updated.splice(idx, 1);
            updated.unshift(moved);
          } else {
            updated = [entry, ...list];
          }
          // Cap at MAX_HISTORY
          if (updated.length > MAX_HISTORY) {
            updated = updated.slice(0, MAX_HISTORY);
          }
          return {byProfile: {...state.byProfile, [profileId]: updated}};
        }),

      removeEntry: (profileId: string, entryId: string) =>
        set(state => {
          const list = state.byProfile[profileId] ?? [];
          return {
            byProfile: {
              ...state.byProfile,
              [profileId]: list.filter(e => e.id !== entryId),
            },
          };
        }),

      getHistory: (profileId: string) =>
        get().byProfile[profileId] ?? [],

      getEntry: (profileId: string, entryId: string) =>
        (get().byProfile[profileId] ?? []).find(e => e.id === entryId),

      clearHistory: (profileId: string) =>
        set(state => ({byProfile: {...state.byProfile, [profileId]: []}})),

      removeProfileData: (profileId: string) =>
        set(state => {
          const {[profileId]: _, ...rest} = state.byProfile;
          return {byProfile: rest};
        }),
    }),
    {
      name: 'luma-watch-history',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
