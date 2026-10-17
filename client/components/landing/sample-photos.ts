/**
 * Sample photography for the public landing page.
 * These are Unsplash photos (Unsplash License) used purely as illustrative
 * library content. They are never shown inside the authenticated workspace.
 */
export type SamplePhoto = {
  id: string;
  alt: string;
  /** Intrinsic ratio used for layout so there is no layout shift. */
  ratio: "square" | "portrait" | "landscape";
};

const base = "https://images.unsplash.com/photo-";

export function samplePhotoUrl(id: string, width = 900) {
  return `${base}${id}?auto=format&fit=crop&w=${width}&q=75`;
}

export const samplePhotos: SamplePhoto[] = [
  { id: "1506905925346-21bda4d32df4", alt: "Mountain lake at sunset", ratio: "landscape" },
  { id: "1470071459604-3b5ec3a7fe05", alt: "Fog drifting through a pine forest", ratio: "landscape" },
  { id: "1494790108377-be9c29b29330", alt: "Portrait in soft window light", ratio: "portrait" },
  { id: "1507525428034-b723cf961d3e", alt: "Waves rolling onto a quiet beach", ratio: "landscape" },
  { id: "1519681393784-d120267933ba", alt: "Snow-covered peaks under a night sky", ratio: "portrait" },
  { id: "1490750967868-88aa4486c946", alt: "Field of wildflowers", ratio: "landscape" },
  { id: "1477959858617-67f85cf4f1df", alt: "City skyline at dusk", ratio: "landscape" },
  { id: "1527549993586-dff825b37782", alt: "Friends watching the sunset", ratio: "landscape" },
  { id: "1500530855697-b586d89ba3ee", alt: "Road through a misty forest", ratio: "portrait" },
  { id: "1501594907352-04cda38ebc29", alt: "Valley viewed from a high overlook", ratio: "landscape" },
  { id: "1449824913935-59a10b8d2000", alt: "City street in the evening", ratio: "portrait" },
  { id: "1518837695005-2083093ee35b", alt: "Ocean wave curling in sunlight", ratio: "landscape" },
];
