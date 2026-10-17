"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadPhotoFile } from "@/lib/photo-upload";
import { libraryKeys, photoKeys } from "@/lib/query-keys";
import { useUploadStore, type UploadItem } from "@/stores/upload-store";

/**
 * Returns a function that validates files and adds them to the upload queue.
 * The `useUploadQueueProcessor` mounted in the app shell drains the queue.
 */
export function useEnqueueUploads() {
  const enqueue = useUploadStore((state) => state.enqueue);

  return useCallback(
    (input: FileList | File[] | null | undefined) => {
      const files = input ? Array.from(input) : [];
      if (files.length === 0) return;

      const { accepted, rejected } = enqueue(files);
      if (rejected.length === 0) return;

      const first = rejected[0];
      if (accepted === 0 && rejected.length === 1) {
        toast.error(`${first.file.name} was not added`, { description: first.error ?? undefined });
      } else {
        toast.warning(`${rejected.length} file${rejected.length === 1 ? "" : "s"} skipped`, {
          description: first.error ?? undefined,
        });
      }
    },
    [enqueue],
  );
}

function summarize(items: UploadItem[]) {
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "error").length;
  if (done > 0 && failed === 0) {
    toast.success(done === 1 ? "Photo uploaded" : `${done} photos uploaded`);
  } else if (done > 0) {
    toast.warning(`${done} uploaded, ${failed} failed`);
  }
}

/**
 * Drains the upload queue one file at a time (the backend accepts a single
 * file per request). Mount exactly once inside the authenticated shell.
 */
export function useUploadQueueProcessor() {
  const queryClient = useQueryClient();
  const items = useUploadStore((state) => state.items);
  const update = useUploadStore((state) => state.update);
  const controllers = useRef(new Map<string, AbortController>());
  const busy = useRef(false);

  const cancel = useCallback(
    (id: string) => {
      const controller = controllers.current.get(id);
      if (controller) {
        controller.abort();
        return;
      }
      update(id, { status: "cancelled", error: "Cancelled" });
    },
    [update],
  );

  useEffect(() => {
    if (busy.current) return;
    const next = items.find((item) => item.status === "queued");
    if (!next) return;

    busy.current = true;
    const controller = new AbortController();
    controllers.current.set(next.id, controller);
    update(next.id, { status: "uploading", progress: 0 });

    const finish = (patch: Partial<Omit<UploadItem, "id" | "file">>) => {
      controllers.current.delete(next.id);
      busy.current = false;
      update(next.id, patch);

      const remaining = useUploadStore.getState().items;
      if (!remaining.some((item) => item.status === "queued")) {
        summarize(remaining);
      }
    };

    uploadPhotoFile(next.file, (progress) => update(next.id, { progress }), controller.signal)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: photoKeys.all });
        queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
        finish({ status: "done", progress: 100 });
      })
      .catch((error: unknown) => {
        const cancelled = error instanceof DOMException && error.name === "AbortError";
        finish({
          status: cancelled ? "cancelled" : "error",
          error: cancelled ? "Cancelled" : error instanceof Error ? error.message : "Upload failed",
        });
      });
  }, [items, queryClient, update]);

  return { cancel };
}
