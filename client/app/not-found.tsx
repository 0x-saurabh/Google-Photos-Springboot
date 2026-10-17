import Link from "next/link";
import { PixoraLogo } from "@/components/brand/pixora-logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <PixoraLogo />
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">404</p>
        <h1 className="font-display text-4xl text-foreground">This page isn&apos;t in the library.</h1>
        <p className="text-sm text-muted-foreground">
          The link may be wrong, or the page may have moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Homepage
        </Link>
        <Link href="/photos" className={buttonVariants()}>
          Open photos
        </Link>
      </div>
    </div>
  );
}
