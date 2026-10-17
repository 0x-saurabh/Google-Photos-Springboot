import Image from "next/image";
import { FolderOpen, ImageUp } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { samplePhotoUrl, samplePhotos } from "@/components/landing/sample-photos";

const steps = [
  {
    number: "01",
    title: "Upload photos",
    body: "Drop files into the library or use the upload button. Each file is sent to the Pixora backend, which stores it in ImageKit and records it in your library.",
  },
  {
    number: "02",
    title: "Organize into albums",
    body: "Select photos and add them to an album, set a cover and keep the main library clean with archive and trash.",
  },
  {
    number: "03",
    title: "Browse and rediscover",
    body: "Open any photo full-size with its details, step through neighbours with the keyboard, and let ImageKit serve the right size for every screen.",
  },
];

function UploadIllustration() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/40 bg-accent/40 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
        <ImageUp className="size-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">Drop photos here</p>
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF, HEIC</p>
    </div>
  );
}

function AlbumIllustration() {
  const [a, b, c] = [samplePhotos[3], samplePhotos[6], samplePhotos[9]];
  return (
    <div className="relative flex h-full items-end justify-center p-6">
      {[c, b, a].map((photo, index) => (
        <div
          key={photo.id}
          className="absolute aspect-[4/3] w-[62%] overflow-hidden rounded-lg border border-border bg-muted shadow-photo"
          style={{
            transform: `translate(${(index - 1) * 14}%, ${(2 - index) * -8}%) rotate(${(index - 1) * 3}deg)`,
            zIndex: index,
          }}
        >
          <Image
            src={samplePhotoUrl(photo.id, 600)}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
      <div className="relative z-10 mt-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        <FolderOpen className="size-3.5 text-primary" aria-hidden="true" />
        Summer, 3 photos
      </div>
    </div>
  );
}

function BrowseIllustration() {
  const grid = [samplePhotos[0], samplePhotos[4], samplePhotos[11], samplePhotos[8], samplePhotos[7], samplePhotos[5]];
  return (
    <div className="grid h-full grid-cols-3 gap-1.5 p-4">
      {grid.map((photo, index) => (
        <div
          key={photo.id}
          className={
            index === 0
              ? "relative col-span-2 row-span-2 overflow-hidden rounded-md bg-muted ring-2 ring-primary ring-offset-2 ring-offset-card"
              : "relative aspect-square overflow-hidden rounded-md bg-muted"
          }
        >
          <Image
            src={samplePhotoUrl(photo.id, 400)}
            alt=""
            fill
            sizes="120px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

const illustrations = [UploadIllustration, AlbumIllustration, BrowseIllustration];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from camera roll to a library you enjoy opening."
        />

        <ol className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16">
          {steps.map((step, index) => {
            const Illustration = illustrations[index];
            return (
              <li
                key={step.number}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="h-52 border-b border-border/70 bg-background">
                  <Illustration />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="font-display text-2xl text-primary">{step.number}</span>
                  <h3 className="mt-2 text-[15px] font-medium text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ImageKit handles file storage, thumbnails and image transformations. Accounts, sign-in
          and who can see which photo are handled by the Pixora backend, not by ImageKit.
        </p>
      </div>
    </section>
  );
}
