"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useAuth, useCurrentUser } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";

type AuthGuardProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/** Protects pages that require login. */
export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isLoggedIn } = useAuth();
  const { isLoading } = useCurrentUser();
  const setReady = useAuthStore((state) => state.setReady);
  const signedOut = useAuthStore((state) => state.signedOut);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi) {
      setReady();
      return;
    }

    const unsub = persistApi.onFinishHydration(() => setReady());
    if (persistApi.hasHydrated()) setReady();
    return unsub;
  }, [setReady]);

  useEffect(() => {
    if (!isReady || isLoggedIn) return;
    if (signedOut) {
      // The user chose to leave: go to the public homepage, not the login form.
      router.replace("/");
      return;
    }
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${redirectTo}${next}`);
  }, [isReady, isLoggedIn, pathname, redirectTo, router, signedOut]);

  if (!isReady || !isLoggedIn || isLoading) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-background text-muted-foreground"
        role="status"
        aria-label="Loading your library"
      >
        <Spinner className="size-5" />
      </div>
    );
  }

  return children;
}
