"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { PhotoAiEditor } from "@/components/photos/photo-ai-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhoto } from "@/hooks/use-ai";
import { useParams } from "next/navigation";

export default function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: photo, isLoading, isError } = usePhoto(id);

  if (isLoading) {
    return <Skeleton className="mx-auto aspect-square w-full max-w-3xl rounded-xl" />;
  }

  if (isError || !photo) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">This photo could not be loaded.</p>
        <Link className={buttonVariants({ variant: "outline" })} href="/photos">
          Back to photos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link className={buttonVariants({ variant: "ghost", className: "-ml-3" })} href="/photos">
        <ArrowLeft className="size-4" />
        Back to photos
      </Link>
      <div className="relative flex min-h-[min(70vh,44rem)] items-center justify-center overflow-hidden rounded-xl bg-muted/40">
        <Image
          src={photo.url}
          alt={photo.fileName}
          width={photo.width ?? 1600}
          height={photo.height ?? 1200}
          className="max-h-[min(70vh,44rem)] w-auto max-w-full object-contain"
          unoptimized
          priority
        />
      </div>
      <div>
        <h1 className="truncate text-lg font-medium">{photo.fileName}</h1>
        <p className="text-sm text-muted-foreground">
          {photo.mimeType ?? "Image"} · {new Date(photo.createdAt).toLocaleDateString()}
        </p>
      </div>
      <PhotoAiEditor photoId={photo.id} />
    </div>
  );
}
