"use client";

import { AlertCircle, Check, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadQueueProcessor } from "@/hooks/use-upload-queue";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import { useUploadStore, type UploadItem } from "@/stores/upload-store";

function statusLabel(item: UploadItem) {
  switch (item.status) {
    case "queued":
      return "Waiting";
    case "uploading":
      return `${item.progress}%`;
    case "done":
      return "Uploaded";
    case "cancelled":
      return "Cancelled";
    case "error":
      return item.error ?? "Failed";
  }
}

/**
 * Floating upload progress panel. Mounted once in the app shell so uploads
 * keep running while the user navigates between pages.
 */
export function UploadTray() {
  const { cancel } = useUploadQueueProcessor();
  const items = useUploadStore((state) => state.items);
  const remove = useUploadStore((state) => state.remove);
  const clearFinished = useUploadStore((state) => state.clearFinished);

  if (items.length === 0) return null;

  const active = items.filter((item) => item.status === "queued" || item.status === "uploading");
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "error").length;

  const heading =
    active.length > 0
      ? `Uploading ${active.length} ${active.length === 1 ? "photo" : "photos"}`
      : failed > 0
        ? `${done} uploaded, ${failed} failed`
        : `${done} ${done === 1 ? "photo" : "photos"} uploaded`;

  return (
    <section
      aria-label="Upload progress"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-float animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      <header className="flex items-center gap-2 border-b border-border/70 px-3.5 py-2.5">
        <Upload className={cn("size-4", active.length > 0 ? "text-primary" : "text-muted-foreground")} />
        <p className="flex-1 truncate text-sm font-medium">{heading}</p>
        {active.length === 0 && (
          <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={clearFinished}>
            <X />
          </Button>
        )}
      </header>

      <ul className="scrollbar-thin max-h-64 divide-y divide-border/60 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  item.status === "done" && "bg-primary/15 text-primary",
                  item.status === "error" && "bg-destructive/15 text-destructive",
                  (item.status === "queued" || item.status === "uploading" || item.status === "cancelled") &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {item.status === "done" ? (
                  <Check className="size-3.5" />
                ) : item.status === "error" ? (
                  <AlertCircle className="size-3.5" />
                ) : (
                  <Upload className="size-3" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                <p
                  className={cn(
                    "truncate text-[11px] text-muted-foreground",
                    item.status === "error" && "text-destructive",
                  )}
                >
                  {formatBytes(item.file.size)} · {statusLabel(item)}
                </p>
              </div>
              {item.status === "queued" || item.status === "uploading" ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Cancel ${item.file.name}`}
                  onClick={() => cancel(item.id)}
                >
                  <X />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${item.file.name} from list`}
                  onClick={() => remove(item.id)}
                >
                  <X />
                </Button>
              )}
            </div>
            {item.status === "uploading" && (
              <div
                className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.progress}
                aria-label={`Uploading ${item.file.name}`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
