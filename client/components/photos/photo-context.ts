import type { PhotoStatus } from "@/lib/api";

/** Where a photo grid is being shown; drives which actions are offered. */
export type PhotoContext =
  | { kind: "library"; status: PhotoStatus }
  | { kind: "album"; albumId: string; coverPhotoId: string | null };

/** Builds the viewer URL so the viewer can offer prev/next within the same list. */
export function photoHref(photoId: string, context: PhotoContext): string {
  const params = new URLSearchParams();
  if (context.kind === "album") {
    params.set("album", context.albumId);
  } else if (context.status !== "ACTIVE") {
    params.set("status", context.status);
  }
  const query = params.toString();
  return `/photos/${photoId}${query ? `?${query}` : ""}`;
}

/** Reverse of `photoHref`: where "back" should go. */
export function contextBackHref(context: PhotoContext): string {
  if (context.kind === "album") return `/albums/${context.albumId}`;
  if (context.status === "ARCHIVE") return "/archive";
  if (context.status === "TRASH") return "/trash";
  return "/photos";
}
