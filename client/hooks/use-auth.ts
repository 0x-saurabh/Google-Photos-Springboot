"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { authKeys } from "@/lib/query-keys";
import type { LoginFormValues, RegisterFormValues } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/auth-store";

/** Where authenticated users land after signing in. */
export const APP_HOME = "/dashboard";

/**
 * Honors `?next=/some/path` set by the auth guard. Only same-origin paths are
 * accepted so the parameter can't be used for open redirects.
 */
export function postLoginDestination(): string {
  if (typeof window === "undefined") return APP_HOME;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : APP_HOME;
}

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const cachedUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => api.me(),
    enabled: !!accessToken,
    initialData: cachedUser ?? undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/** Login → save tokens → go to the workspace */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (values: LoginFormValues) => api.login(values),
    onSuccess: (data) => {
      setAuth(data);
      queryClient.setQueryData(authKeys.me(), data.user);
      toast.success(`Welcome back, ${data.user.displayName}`);
      router.replace(postLoginDestination());
    },
  });
}

/** Register → save tokens → go to the workspace */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (values: RegisterFormValues) => api.register(values),
    onSuccess: (data) => {
      setAuth(data);
      queryClient.setQueryData(authKeys.me(), data.user);
      toast.success("Account created");
      router.replace(APP_HOME);
    },
  });
}

/** Logout → clear tokens → go to the landing page */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      clearAuth({ signedOut: true });
      queryClient.clear();
      toast.success("Signed out");
      router.replace("/");
    },
  });
}

export function useAuth() {
  const isReady = useAuthStore((state) => state.isReady);
  const accessToken = useAuthStore((state) => state.accessToken);

  return {
    isReady,
    isLoggedIn: !!accessToken,
  };
}
