import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { samplePhotoUrl, samplePhotos } from "@/components/landing/sample-photos";
import { cn } from "@/lib/utils";

/* Hand-placed composition on a 3x3 grid: index into samplePhotos, cell placement. */
const collage = [
  { photo: samplePhotos[0], className: "col-span-2 row-span-2", delay: 150 },
  { photo: samplePhotos[2], className: "col-start-3 row-start-1", delay: 260 },
  { photo: samplePhotos[5], className: "col-start-3 row-start-2", delay: 340 },
  { photo: samplePhotos[8], className: "col-start-1 row-start-3", delay: 420 },
  { photo: samplePhotos[1], className: "col-span-2 col-start-2 row-start-3", delay: 500 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <div className="max-w-xl">
          <p
            className="reveal mb-5 inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
            style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Cloud photo management
          </p>

          <h1
            className="reveal font-display text-[2.75rem] leading-[1.02] text-foreground text-balance sm:text-6xl lg:text-[4.25rem]"
            style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
          >
            Your memories, <em className="text-primary">beautifully</em> organized.
          </h1>

          <p
            className="reveal mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ "--reveal-delay": "140ms" } as React.CSSProperties}
          >
            Pixora is a private photo library in the cloud. Upload from any device, sort into
            albums, and let ImageKit deliver crisp images everywhere.
          </p>

          <div
            className="reveal mt-8 flex flex-wrap items-center gap-3"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            <Link href="/register" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
              Start organizing
              <ArrowRight data-icon="inline-end" />
            </Link>
            <a
              href="#features"
              className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-4" })}
            >
              Explore features
            </a>
          </div>

          <ul
            className="reveal mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
            style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
          >
            {["Private per-user library", "Albums, archive and trash", "Original files kept intact"].map(
              (item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="relative">
          <div
            className="grid aspect-square w-full grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3 lg:ml-auto lg:max-w-[34rem]"
            aria-label="Sample photo library"
          >
            {collage.map(({ photo, className, delay }) => (
              <figure
                key={photo.id}
                className={cn(
                  "reveal group relative overflow-hidden rounded-xl bg-muted shadow-photo",
                  className,
                )}
                style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
              >
                <Image
                  src={samplePhotoUrl(photo.id, 900)}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  unoptimized
                  priority
                />
              </figure>
            ))}
          </div>

          {/* A real UI element from the app: the upload status card. */}
          <div
            className="reveal absolute -bottom-6 -left-3 hidden w-60 rounded-xl border border-border bg-card p-3.5 shadow-float sm:block lg:-left-8"
            style={{ "--reveal-delay": "620ms" } as React.CSSProperties}
            aria-hidden="true"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Uploading 3 photos</span>
              <span className="text-muted-foreground">2 of 3</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
            <p className="mt-2 truncate text-[11px] text-muted-foreground">
              lisbon-rooftop-evening.jpg
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
