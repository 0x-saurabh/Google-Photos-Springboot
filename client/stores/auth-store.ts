"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthResponse, User } from "@/lib/api";

/**
 * Stores the logged-in user + tokens.
 * `persist` saves them in localStorage so a page refresh keeps you logged in.
 * `isReady` becomes true after that saved data has been loaded.
 */
type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isReady: boolean;
  /** True right after the user chose to sign out, so guards send them home instead of to login. */
  signedOut: boolean;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: (options?: { signedOut?: boolean }) => void;
  setReady: () => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isReady: false,
      signedOut: false,
      setAuth: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
          signedOut: false,
        }),
      clearAuth: (options) =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          signedOut: options?.signedOut ?? false,
        }),
      setReady: () => set({ isReady: true }),
    }),
    {
      name: "gp-auth",
      // Noop on the server so persist still hydrates and sets isReady
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setReady();
      },
    },
  ),
);