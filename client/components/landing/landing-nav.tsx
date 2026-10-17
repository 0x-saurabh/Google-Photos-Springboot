"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { PixoraLogo } from "@/components/brand/pixora-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { APP_HOME, useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#preview", label: "Preview" },
];

export function LandingNav() {
  const { isReady, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showWorkspace = isReady && isLoggedIn;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled
          ? "border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          <PixoraLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ModeToggle />
          <div className="hidden items-center gap-1.5 md:flex">
            {showWorkspace ? (
              <Link href={APP_HOME} className={buttonVariants({ size: "default" })}>
                Open your library
                <ArrowRight data-icon="inline-end" />
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                  Log in
                </Link>
                <Link href="/register" className={buttonVariants()}>
                  Get started
                </Link>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0 p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>
              <PixoraLogo />
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Mobile" className="flex flex-col px-3 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t px-5 py-5">
            {showWorkspace ? (
              <Link href={APP_HOME} className={buttonVariants({ size: "lg" })}>
                Open your library
              </Link>
            ) : (
              <>
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Get started
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
