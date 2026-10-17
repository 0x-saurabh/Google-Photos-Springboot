import type { Photo } from "@/lib/api";

const IMAGEKIT_HOST = "ik.imagekit.io";

/**
 * Returns true when the URL is served by ImageKit and therefore accepts
 * URL-based transformations.
 */
export function isImageKitUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return new URL(url).hostname === IMAGEKIT_HOST;
  } catch {
    return false;
  }
}

type SquareOptions = {
  size?: number;
  quality?: number;
};

/**
 * Builds a square, smart-cropped rendition via ImageKit's URL transformation
 * (`tr=w-…,h-…,fo-auto`). Any transformation already present on the URL, such
 * as the padded `tr:n-ik_ml_thumbnail` path segment the backend stores, is
 * removed first so the crop starts from the original file.
 *
 * Falls back to the given URL when it isn't served by ImageKit.
 */
export function imagekitSquare(url: string, { size = 600, quality = 80 }: SquareOptions = {}) {
  if (!isImageKitUrl(url)) return url;

  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.replace(/\/tr:[^/]+/g, "");
  parsed.searchParams.delete("tr");
  parsed.searchParams.set("tr", `w-${size},h-${size},fo-auto,q-${quality}`);
  return parsed.toString();
}

/** Grid thumbnail for a photo: square crop from the original when possible. */
export function photoThumbnailSrc(photo: Pick<Photo, "url" | "thumbnailUrl">, size = 600) {
  if (isImageKitUrl(photo.url)) return imagekitSquare(photo.url, { size });
  return photo.thumbnailUrl ?? photo.url;
}

/** Album cover: the API only exposes the (padded) thumbnail, so re-crop it. */
export function albumCoverSrc(coverThumbnailUrl: string, size = 800) {
  return imagekitSquare(coverThumbnailUrl, { size });
}
