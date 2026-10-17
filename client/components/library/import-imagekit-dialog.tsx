"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, CloudDownload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useImportImageKitAssets } from "@/hooks/use-ai";
import { useImageKitAssets } from "@/hooks/use-library";
import { formatBytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";

type ImportImageKitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Lists files that already exist in the connected ImageKit folder and lets the
 * user register them in this library without re-uploading.
 */
export function ImportImageKitDialog({ open, onOpenChange }: ImportImageKitDialogProps) {
  const { data: assets = [], isLoading, isError, error, refetch, isRefetching } = useImageKitAssets();
  const importMutation = useImportImageKitAssets();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const importable = assets.filter((asset) => !asset.alreadyImported);
  const allSelected = importable.length > 0 && selectedIds.length === importable.length;

  function toggle(fileId: string) {
    setSelectedIds((current) =>
      current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId],
    );
  }

  function close() {
    setSelectedIds([]);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          refetch();
        } else {
          close();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import from ImageKit</DialogTitle>
          <DialogDescription>
            Files already stored in your ImageKit folder that aren&apos;t in this library yet.
          </DialogDescription>
        </DialogHeader>

        {importable.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{importable.length} available</span>
            <button
              type="button"
              className="underline-offset-4 hover:text-foreground hover:underline"
              onClick={() =>
                setSelectedIds(allSelected ? [] : importable.map((asset) => asset.fileId))
              }
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
        )}

        <div className="scrollbar-thin max-h-[50vh] space-y-1 overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))
          ) : isError ? (
            <ErrorState
              title="Couldn't reach ImageKit"
              description={error instanceof Error ? error.message : undefined}
              onRetry={() => refetch()}
              retrying={isRefetching}
            />
          ) : importable.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
              Everything in your ImageKit folder is already in the library.
            </p>
          ) : (
            importable.map((asset) => {
              const selected = selectedIds.includes(asset.fileId);
              return (
                <button
                  key={asset.fileId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(asset.fileId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    selected ? "border-primary/60 bg-accent" : "border-transparent hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {asset.thumbnailUrl && (
                      <Image src={asset.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{asset.fileName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {asset.sizeBytes > 0 ? formatBytes(asset.sizeBytes) : "Unknown size"}
                      {asset.width && asset.height ? ` · ${asset.width} × ${asset.height}` : ""}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => importMutation.mutate(selectedIds, { onSuccess: close })}
            disabled={selectedIds.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? <Spinner className="size-4" /> : <CloudDownload />}
            Import {selectedIds.length > 0 ? selectedIds.length : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
