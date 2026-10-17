"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { postLoginDestination, useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";

type GuestGuardProps = {
  children: React.ReactNode;
};

/**
 * For login/register pages — redirect away if already logged in.
 * Honors the same `?next=` target as the login flow so both agree.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { isReady, isLoggedIn } = useAuth();
  const setReady = useAuthStore((state) => state.setReady);

  // Persist may finish before mount — subscribe first, then check.
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
    if (isReady && isLoggedIn) {
      router.replace(postLoginDestination());
    }
  }, [isReady, isLoggedIn, router]);

  if (!isReady || isLoggedIn) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-background text-muted-foreground"
        role="status"
        aria-label="Loading"
      >
        <Spinner className="size-5" />
      </div>
    );
  }

  return children;
}
