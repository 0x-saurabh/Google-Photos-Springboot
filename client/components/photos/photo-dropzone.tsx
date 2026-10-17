"use client";

import { useCallback, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { useEnqueueUploads } from "@/hooks/use-upload-queue";
import { cn } from "@/lib/utils";

type PhotoDropzoneProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

function hasFiles(event: React.DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/**
 * Makes a region accept dropped image files. Shows a full-area overlay while
 * files are dragged over it; the queue handles validation and progress.
 */
export function PhotoDropzone({ children, className, disabled }: PhotoDropzoneProps) {
  const enqueue = useEnqueueUploads();
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const onDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((event: React.DragEvent) => {
    if (!hasFiles(event)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  }, []);

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [disabled],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      enqueue(event.dataTransfer.files);
    },
    [disabled, enqueue],
  );

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
      {dragging && (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm animate-in fade-in-0 duration-150"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ImageUp className="size-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Drop to upload</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF or HEIC</p>
          </div>
        </div>
      )}
    </div>
  );
}
