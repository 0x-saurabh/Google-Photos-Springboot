"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type PhotoSort, type PhotoStatus } from "@/lib/api";
import { albumKeys, libraryKeys, photoKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { usePhotoSelectionStore } from "@/stores/photo-selection-store";

const PAGE_SIZE = 24;

type UsePhotosOptions = {
  enabled?: boolean;
  /** Server-side file name search. */
  q?: string;
  sort?: PhotoSort;
};

export function usePhotos(status: PhotoStatus = "ACTIVE", options: UsePhotosOptions = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { enabled = true, q = "", sort = "newest" } = options;

  return useInfiniteQuery({
    queryKey: photoKeys.list(status, q, sort),
    queryFn: ({ pageParam = 0 }) =>
      api.getPhotos({ status, page: pageParam, size: PAGE_SIZE, q, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: !!accessToken && enabled,
  });
}

function usePhotoBulkMutation(
  mutationFn: (photoIds: string[]) => Promise<void>,
  messages: { one: string; many: (count: number) => string },
) {
  const queryClient = useQueryClient();
  const exitSelectMode = usePhotoSelectionStore((state) => state.exitSelectMode);

  return useMutation({
    mutationFn,
    onSuccess: (_, photoIds) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
      exitSelectMode();
      toast.success(photoIds.length === 1 ? messages.one : messages.many(photoIds.length));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Action failed");
    },
  });
}

export function useArchivePhotos() {
  return usePhotoBulkMutation(api.archivePhotos, {
    one: "Photo archived",
    many: (count) => `${count} photos archived`,
  });
}

export function useTrashPhotos() {
  return usePhotoBulkMutation(api.trashPhotos, {
    one: "Photo moved to trash",
    many: (count) => `${count} photos moved to trash`,
  });
}

export function useRestorePhotos() {
  return usePhotoBulkMutation(api.restorePhotos, {
    one: "Photo restored",
    many: (count) => `${count} photos restored`,
  });
}

export function usePermanentlyDeletePhotos() {
  return usePhotoBulkMutation(api.permanentlyDeletePhotos, {
    one: "Photo permanently deleted",
    many: (count) => `${count} photos permanently deleted`,
  });
}
