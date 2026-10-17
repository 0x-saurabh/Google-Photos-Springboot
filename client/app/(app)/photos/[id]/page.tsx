"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { PhotoContext } from "@/components/photos/photo-context";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { Spinner } from "@/components/ui/spinner";
import type { PhotoStatus } from "@/lib/api";

function isStatus(value: string | null): value is PhotoStatus {
  return value === "ACTIVE" || value === "ARCHIVE" || value === "TRASH";
}

function PhotoDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const album = searchParams.get("album");
  const status = searchParams.get("status");

  const context = useMemo<PhotoContext>(() => {
    if (album) return { kind: "album", albumId: album, coverPhotoId: null };
    return { kind: "library", status: isStatus(status) ? status : "ACTIVE" };
  }, [album, status]);

  return <PhotoViewer photoId={id} context={context} />;
}

export default function PhotoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage text-stage-foreground">
          <Spinner className="size-6" />
        </div>
      }
    >
      <PhotoDetailContent />
    </Suspense>
  );
}
