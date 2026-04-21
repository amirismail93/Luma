import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {zustandStorage} from '@/services/storage';

export interface FavoriteItem {
  id: string;
  title: string;
  posterUrl?: string;
  type: 'movie' | 'series' | 'channel';
  addedAt: number;
}

/** Favorites are stored per-profile: { [profileId]: FavoriteItem[] } */
export interface FavoritesState {
  byProfile: Record<string, FavoriteItem[]>;
  addFavorite: (profileId: string, item: FavoriteItem) => void;
  removeFavorite: (profileId: string, itemId: string) => void;
  isFavorite: (profileId: string, itemId: string) => boolean;
  getFavorites: (profileId: string) => FavoriteItem[];
  clearFavorites: (profileId: string) => void;
  removeProfileData: (profileId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      byProfile: {},

      addFavorite: (profileId: string, item: FavoriteItem) =>
        set(state => {
          const list = state.byProfile[profileId] ?? [];
          if (list.some(f => f.id === item.id)) return state;
          return {byProfile: {...state.byProfile, [profileId]: [...list, item]}};
        }),

      removeFavorite: (profileId: string, itemId: string) =>
        set(state => {
          const list = state.byProfile[profileId] ?? [];
          return {
            byProfile: {
              ...state.byProfile,
              [profileId]: list.filter(f => f.id !== itemId),
            },
          };
        }),

      isFavorite: (profileId: string, itemId: string) =>
        (get().byProfile[profileId] ?? []).some(f => f.id === itemId),

      getFavorites: (profileId: string) =>
        get().byProfile[profileId] ?? [],

      clearFavorites: (profileId: string) =>
        set(state => ({byProfile: {...state.byProfile, [profileId]: []}})),

      removeProfileData: (profileId: string) =>
        set(state => {
          const {[profileId]: _, ...rest} = state.byProfile;
          return {byProfile: rest};
        }),
    }),
    {
      name: 'luma-favorites',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
