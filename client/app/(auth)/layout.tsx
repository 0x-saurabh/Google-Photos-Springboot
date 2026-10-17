import Image from "next/image";
import Link from "next/link";
import { PixoraLogo } from "@/components/brand/pixora-logo";
import { GuestGuard } from "@/components/auth/guest-guard";
import { samplePhotoUrl, samplePhotos } from "@/components/landing/sample-photos";
import { ModeToggle } from "@/components/ui/mode-toggle";

const panelPhoto = samplePhotos[0];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <div className="grid min-h-svh bg-background lg:grid-cols-[1.1fr_1fr]">
        {/* Photographic panel: desktop only. */}
        <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
          <Image
            src={samplePhotoUrl(panelPhoto.id, 1600)}
            alt=""
            fill
            sizes="55vw"
            className="object-cover"
            priority
            unoptimized
          />
          <div className="overlay-bottom absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="font-display text-4xl leading-tight text-balance">
              Your memories, <em>beautifully</em> organized.
            </p>
            <p className="mt-3 max-w-md text-sm text-white/80">
              A private library for the photos you want to keep, with albums, archive and AI edits
              powered by ImageKit.
            </p>
          </div>
        </aside>

        <div className="relative flex flex-col px-5 py-6 sm:px-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
              <PixoraLogo />
            </Link>
            <ModeToggle variant="outline" />
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="underline-offset-4 hover:underline">
              Back to the Pixora homepage
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
