"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PhotoEditor } from "@/components/editor/photo-editor";
import { Spinner } from "@/components/ui/spinner";

function PhotoEditContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return <PhotoEditor photoId={id} backHref={`/photos/${id}${query ? `?${query}` : ""}`} />;
}

export default function PhotoEditPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage text-stage-foreground">
          <Spinner className="size-6" />
        </div>
      }
    >
      <PhotoEditContent />
    </Suspense>
  );
}
