import {MMKV} from 'react-native-mmkv';

/**
 * Global MMKV instance used for fast local key-value storage.
 * Stores: favorites, profiles, settings, watch history cache.
 */
let _storage: MMKV;
try {
  _storage = new MMKV({
    id: 'luma-storage',
    encryptionKey: undefined, // set a key here if you need encrypted storage
  });
} catch (e) {
  console.warn('MMKV init failed, using fallback:', e);
  // Fallback in-memory storage if MMKV native module isn't available
  const map = new Map<string, string>();
  _storage = {
    set: (key: string, value: string | number | boolean) => map.set(key, String(value)),
    getString: (key: string) => map.get(key),
    getNumber: (key: string) => { const v = map.get(key); return v ? Number(v) : undefined; },
    getBoolean: (key: string) => map.get(key) === 'true',
    delete: (key: string) => { map.delete(key); },
    getAllKeys: () => [...map.keys()],
    clearAll: () => map.clear(),
    contains: (key: string) => map.has(key),
  } as unknown as MMKV;
}
export const storage = _storage;

/* ------------------------------------------------------------------ */
/*  Typed helpers                                                     */
/* ------------------------------------------------------------------ */

export function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function getItem<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function removeItem(key: string): void {
  storage.delete(key);
}

export function clearAll(): void {
  storage.clearAll();
}

/* ------------------------------------------------------------------ */
/*  Zustand persist-storage adapter (StateStorage compatible)         */
/* ------------------------------------------------------------------ */

import type {StateStorage} from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};
