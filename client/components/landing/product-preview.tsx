import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  FolderOpen,
  Images,
  ImageUp,
  LayoutGrid,
  Search,
  Trash2,
} from "lucide-react";
import { PixoraLogo } from "@/components/brand/pixora-logo";
import { SectionHeading } from "@/components/landing/section-heading";
import { samplePhotoUrl, samplePhotos } from "@/components/landing/sample-photos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Mirrors the real workspace navigation so the preview matches what users get. */
const nav = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Photos", icon: Images, active: true },
  { label: "Albums", icon: FolderOpen },
  { label: "Archive", icon: Archive },
  { label: "Trash", icon: Trash2 },
];

export function ProductPreview() {
  return (
    <section id="preview" className="scroll-mt-20 border-t border-border/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="The workspace"
            title="A quiet interface that puts the photographs first."
            description="The same layout, type and spacing you see here carry through the whole app, in light and dark."
          />
          <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Create a free account
          </Link>
        </div>

        <div
          className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-float lg:mt-16"
          aria-label="Preview of the Pixora workspace"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </span>
            <span className="mx-auto rounded-md bg-background px-3 py-0.5 text-[11px] text-muted-foreground">
              pixora.app/photos
            </span>
          </div>

          <div className="grid min-h-[420px] grid-cols-[13.5rem_1fr] max-sm:grid-cols-1">
            <aside className="hidden flex-col border-r border-sidebar-border bg-sidebar p-3 sm:flex">
              <div className="px-2 py-2">
                <PixoraLogo />
              </div>
              <nav className="mt-3 flex flex-col gap-0.5" aria-hidden="true">
                {nav.map(({ label, icon: Icon, active }) => (
                  <span
                    key={label}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </span>
                ))}
              </nav>
              <div className="mt-auto rounded-lg border border-sidebar-border bg-background/60 px-3 py-2.5 text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground">Library storage</p>
                <p className="mt-0.5">Shown from real usage once you sign in</p>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground">
                  <Search className="size-3.5" aria-hidden="true" />
                  Filter by file name
                </div>
                <span className={buttonVariants({ size: "sm", className: "pointer-events-none" })}>
                  <ImageUp data-icon="inline-start" />
                  Upload
                </span>
              </div>
              <div className="p-4">
                <p className="font-display text-2xl text-foreground">Photos</p>
                <p className="mt-0.5 text-xs text-muted-foreground">12 photos</p>
                <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                  {samplePhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md bg-muted",
                        index === 1 && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                    >
                      <Image
                        src={samplePhotoUrl(photo.id, 400)}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 640px) 30vw, 140px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
