"use client";

import { useState } from "react";
import Link from "next/link";
import { CloudDownload, FolderPlus, Images, SlidersHorizontal } from "lucide-react";
import { CreateAlbumDialog } from "@/components/albums/create-album-dialog";
import { LibrarySummary } from "@/components/dashboard/library-summary";
import { RecentAlbums } from "@/components/dashboard/recent-albums";
import { RecentPhotos } from "@/components/dashboard/recent-photos";
import { ImportImageKitDialog } from "@/components/library/import-imagekit-dialog";
import { PhotoDropzone } from "@/components/photos/photo-dropzone";
import { PhotoUploadButton } from "@/components/photos/photo-upload-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-mounted";
import { greetingForHour } from "@/lib/format-date";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const [importOpen, setImportOpen] = useState(false);
  // Time-based greeting is client-only so server and client markup match.
  const mounted = useMounted();
  const greeting = mounted ? greetingForHour(new Date().getHours()) : "Welcome";

  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  return (
    <PhotoDropzone className="-m-2 rounded-xl p-2">
      <div className="space-y-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[2rem] leading-none text-foreground sm:text-4xl">
              {greeting}
              {firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s what&apos;s new in your library.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PhotoUploadButton size="sm" label="Upload photos" />
            <CreateAlbumDialog variant="outline" />
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <CloudDownload />
              Import from ImageKit
            </Button>
            <Link href="/photos" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <Images />
              Open library
            </Link>
          </div>
        </header>

        <ImportImageKitDialog open={importOpen} onOpenChange={setImportOpen} />

        <div className="grid gap-10 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div className="space-y-10">
            <RecentPhotos />
            <RecentAlbums />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-20">
            <LibrarySummary />
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <p className="font-medium text-foreground">Tips</p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <FolderPlus className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Select several photos and use “Add to album” to organise in one go.
                </li>
                <li className="flex gap-2">
                  <Images className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  In the viewer, press the arrow keys to step through photos and I for details.
                </li>
                <li className="flex gap-2">
                  <SlidersHorizontal className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Press E on any photo to open the editor. Edits are saved as new photos, so originals stay safe.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </PhotoDropzone>
  );
}
