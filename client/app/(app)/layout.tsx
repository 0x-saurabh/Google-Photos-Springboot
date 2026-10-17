"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);

  // Selection never survives a route change.
  useEffect(() => {
    exitSelectMode();
  }, [pathname, exitSelectMode]);

  return (
    <AuthGuard>
      <TooltipProvider delay={300}>
        <AppShell>{children}</AppShell>
      </TooltipProvider>
    </AuthGuard>
  );
}
