/**
 * Triggers a browser download for an ImageKit URL. ImageKit honours
 * `ik-attachment=true` by answering with a Content-Disposition header, which
 * is what makes a cross-origin download work; the `download` attribute alone
 * is ignored for other origins.
 */
export function downloadUrl(url: string, fileName?: string) {
  const target = withAttachmentFlag(url);
  const anchor = document.createElement("a");
  anchor.href = target;
  anchor.rel = "noopener";
  if (fileName) anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function withAttachmentFlag(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "ik.imagekit.io") return url;
    parsed.searchParams.set("ik-attachment", "true");
    return parsed.toString();
  } catch {
    return url;
  }
}
