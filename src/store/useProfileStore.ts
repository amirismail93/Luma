import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {zustandStorage} from '@/services/storage';

export const MAX_PROFILES = 5;

export const DEFAULT_ACCENT_COLOR = '#FF5733';

export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  accentColor: string;
  portalUrl: string;
  mac: string;
  token: string;
}

export interface ProfileState {
  profiles: Profile[];
  activeProfileId: string | null;

  addProfile: (profile: Profile) => boolean;
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => Profile | undefined;
  hasProfiles: () => boolean;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      addProfile: (profile: Profile) => {
        if (get().profiles.length >= MAX_PROFILES) return false;
        set(state => ({profiles: [...state.profiles, profile]}));
        return true;
      },

      updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) =>
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === id ? {...p, ...patch} : p,
          ),
        })),

      removeProfile: (id: string) =>
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== id),
          activeProfileId:
            state.activeProfileId === id ? null : state.activeProfileId,
        })),

      setActiveProfile: (id: string) => set({activeProfileId: id}),

      getActiveProfile: () => {
        const {profiles, activeProfileId} = get();
        return profiles.find(p => p.id === activeProfileId);
      },

      hasProfiles: () => get().profiles.length > 0,
    }),
    {
      name: 'luma-profiles',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
