import type { EditRequest, PhotoSort, PhotoStatus } from "@/lib/api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const photoKeys = {
  all: ["photos"] as const,
  lists: () => [...photoKeys.all, "list"] as const,
  list: (status: PhotoStatus, q = "", sort: PhotoSort = "newest") =>
    [...photoKeys.lists(), status, q, sort] as const,
  detail: (photoId: string) => [...photoKeys.all, "detail", photoId] as const,
  versions: (photoId: string) => [...photoKeys.all, "versions", photoId] as const,
  editPreview: (photoId: string, body: EditRequest) =>
    [...photoKeys.all, "edit-preview", photoId, body] as const,
};

export const libraryKeys = {
  all: ["library"] as const,
  storage: () => [...libraryKeys.all, "storage"] as const,
  imagekitAssets: () => [...libraryKeys.all, "imagekit-assets"] as const,
};

export const albumKeys = {
  all: ["albums"] as const,
  lists: () => [...albumKeys.all, "list"] as const,
  detail: (albumId: string) => [...albumKeys.all, "detail", albumId] as const,
  photos: (albumId: string) => [...albumKeys.all, "photos", albumId] as const,
};