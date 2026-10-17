"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { PixoraMark } from "@/components/brand/pixora-logo";
import { AccountMenu } from "@/components/layout/account-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PhotoUploadButton } from "@/components/photos/photo-upload-button";
import { UploadTray } from "@/components/photos/upload-tray";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarNav />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,85vw)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-svh flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/70 bg-background/85 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:hidden"
            aria-label="Pixora overview"
          >
            <PixoraMark className="text-primary" />
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <PhotoUploadButton size="sm" label="Upload" className="hidden sm:inline-flex" />
            <PhotoUploadButton size="icon-sm" label="" aria-label="Upload photos" className="sm:hidden" />
            <ModeToggle />
            <AccountMenu />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      <UploadTray />
    </div>
  );
}
