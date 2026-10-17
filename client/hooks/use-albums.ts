"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type UpdateAlbumRequest } from "@/lib/api";
import { albumKeys, photoKeys } from "@/lib/query-keys";
import { useAlbumLockStore } from "@/stores/album-lock-store";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 24;

export function useAlbums() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: albumKeys.lists(),
    queryFn: () => api.getAlbums(),
    enabled: !!accessToken,
  });
}

export function useAlbum(albumId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: albumKeys.detail(albumId),
    queryFn: () => api.getAlbum(albumId),
    enabled: !!accessToken && !!albumId,
  });
}

export function useAlbumPhotos(albumId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useInfiniteQuery({
    queryKey: albumKeys.photos(albumId),
    queryFn: ({ pageParam = 0 }) => api.getAlbumPhotos(albumId, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: !!accessToken && !!albumId && enabled,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => api.createAlbum(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      toast.success("Album created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create album");
    },
  });
}

export function useUpdateAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateAlbumRequest) => api.updateAlbum(albumId, body),
    onSuccess: (album, variables) => {
      queryClient.setQueryData(albumKeys.detail(albumId), album);
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      toast.success(variables.coverPhotoId ? "Album cover updated" : "Album renamed");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update album");
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (albumId: string) => api.deleteAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      toast.success("Album deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete album");
    },
  });
}

export function useAddPhotosToAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ albumId, photoIds }: { albumId: string; photoIds: string[] }) =>
      api.addPhotosToAlbum(albumId, photoIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(variables.albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.photos(variables.albumId) });
      toast.success(
        variables.photoIds.length === 1
          ? "Photo added to album"
          : `${variables.photoIds.length} photos added to album`,
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add photos to album");
    },
  });
}

export function useRemovePhotoFromAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => api.removePhotoFromAlbum(albumId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.photos(albumId) });
      toast.success("Photo removed from album");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove photo from album");
    },
  });
}

/** Everything that can change when an album's lock state flips: album, its photos, and the library listing. */
function invalidateLockDependents(queryClient: ReturnType<typeof useQueryClient>, albumId: string) {
  queryClient.invalidateQueries({ queryKey: albumKeys.all });
  queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
  queryClient.invalidateQueries({ queryKey: albumKeys.photos(albumId) });
  queryClient.invalidateQueries({ queryKey: photoKeys.all });
}

export function useLockAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pin: string) => api.lockAlbum(albumId, pin),
    onSuccess: (album) => {
      // Setting a PIN re-locks the album; the owner unlocks it like anyone else would.
      useAlbumLockStore.getState().lock(albumId);
      queryClient.setQueryData(albumKeys.detail(albumId), album);
      invalidateLockDependents(queryClient, albumId);
      toast.success("Album locked", { description: "Its photos are hidden from the library until unlocked." });
    },
  });
}

export function useChangeAlbumPin(albumId: string) {
  return useMutation({
    mutationFn: ({ currentPin, newPin }: { currentPin: string; newPin: string }) =>
      api.changeAlbumPin(albumId, currentPin, newPin),
    onSuccess: () => toast.success("PIN changed"),
  });
}

export function useRemoveAlbumLock(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proof: { pin?: string; password?: string }) => api.removeAlbumLock(albumId, proof),
    onSuccess: (album) => {
      useAlbumLockStore.getState().lock(albumId);
      queryClient.setQueryData(albumKeys.detail(albumId), album);
      invalidateLockDependents(queryClient, albumId);
      toast.success("Lock removed", { description: "The album is visible in your library again." });
    },
  });
}

export function useUnlockAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pin: string) => api.unlockAlbum(albumId, pin),
    onSuccess: (result) => {
      useAlbumLockStore.getState().unlock(albumId, result.albumToken, result.expiresAt);
      invalidateLockDependents(queryClient, albumId);
    },
  });
}

/** Forgets the album's unlock token so it asks for the PIN again. */
export function useRelockAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return () => {
    useAlbumLockStore.getState().lock(albumId);
    queryClient.removeQueries({ queryKey: albumKeys.photos(albumId) });
    invalidateLockDependents(queryClient, albumId);
  };
}
