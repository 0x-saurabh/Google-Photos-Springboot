import {
  Archive,
  FolderOpen,
  ImageUp,
  Lock,
  Search,
  Star,
  WandSparkles,
  Zap,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

const features = [
  {
    icon: ImageUp,
    title: "Upload from anywhere",
    body: "Drag photos into the library or pick them from your device. JPEG, PNG, WebP, GIF and HEIC are accepted, with per-file progress.",
  },
  {
    icon: FolderOpen,
    title: "Albums that stay tidy",
    body: "Group photos by trip, event or theme. Rename albums, choose a cover and add or remove photos at any time.",
  },
  {
    icon: Archive,
    title: "Archive and trash",
    body: "Hide photos from the main library without deleting them, or move them to trash and restore later if you change your mind.",
  },
  {
    icon: WandSparkles,
    title: "An editor that never overwrites",
    body: "Crop, resize, rotate, add effects and chain AI steps such as background removal or upscaling, with a before/after preview. Every result is saved as a new photo.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Every request is authenticated with short-lived tokens issued by the Spring Boot backend. Only you can see your library.",
  },
  {
    icon: Zap,
    title: "Fast delivery",
    body: "Files are stored in ImageKit. Thumbnails and resized versions are generated on the fly from the same original.",
  },
];

const planned = [
  { icon: Star, title: "Favorites" },
  { icon: Search, title: "Search inside albums" },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Features"
          title="Everything a photo library needs. Nothing it doesn't."
          description="Pixora focuses on the handful of things you do every day with your photos and does them carefully."
        />

        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col gap-3 border-t border-dashed border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            On the roadmap, not yet available in the app:
          </p>
          <ul className="flex flex-wrap gap-2">
            {planned.map(({ icon: Icon, title }) => (
              <li
                key={title}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {title}
                <span className="ml-1 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tracking-wide uppercase">
                  Planned
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
