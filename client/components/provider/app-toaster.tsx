"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/** Sonner toaster that follows the active next-themes theme. */
export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-float",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
