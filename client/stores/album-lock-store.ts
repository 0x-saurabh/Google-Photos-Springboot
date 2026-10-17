import { create } from "zustand";

type UnlockedAlbum = {
  token: string;
  /** Epoch milliseconds; mirrors the server-side expiry of the token. */
  expiresAt: number;
};

/**
 * Album tokens received after entering a PIN. Kept in memory only, on purpose:
 * a reload, a new tab or signing out all re-lock every album, and nothing
 * PIN-related ever lands in localStorage.
 */
type AlbumLockState = {
  unlocked: Record<string, UnlockedAlbum>;
  unlock: (albumId: string, token: string, expiresAt: string) => void;
  lock: (albumId: string) => void;
  lockAll: () => void;
  /** True while a token for the album exists and has not expired. */
  isUnlocked: (albumId: string) => boolean;
  /** Expiry of the album's token, or null when it is locked. */
  expiresAt: (albumId: string) => number | null;
  /** Comma-separated live tokens for the X-Album-Token header, or null when none. */
  headerValue: () => string | null;
};

const isLive = (entry: UnlockedAlbum | undefined, now = Date.now()) =>
  !!entry && entry.expiresAt > now;

export const useAlbumLockStore = create<AlbumLockState>((set, get) => ({
  unlocked: {},

  unlock: (albumId, token, expiresAt) =>
    set((state) => ({
      unlocked: { ...state.unlocked, [albumId]: { token, expiresAt: Date.parse(expiresAt) } },
    })),

  lock: (albumId) =>
    set((state) => {
      if (!(albumId in state.unlocked)) return state;
      const next = { ...state.unlocked };
      delete next[albumId];
      return { unlocked: next };
    }),

  lockAll: () => set({ unlocked: {} }),

  isUnlocked: (albumId) => isLive(get().unlocked[albumId]),

  expiresAt: (albumId) => {
    const entry = get().unlocked[albumId];
    return isLive(entry) ? entry.expiresAt : null;
  },

  headerValue: () => {
    const now = Date.now();
    const tokens = Object.values(get().unlocked)
      .filter((entry) => isLive(entry, now))
      .map((entry) => entry.token);
    return tokens.length > 0 ? tokens.join(",") : null;
  },
}));
