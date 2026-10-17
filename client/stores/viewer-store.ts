import { create } from "zustand";

export type AiPreview = {
  photoId: string;
  url: string;
  label: string;
};

/**
 * Viewer preferences that should survive stepping between photos.
 * Each photo is its own route, so component state alone would reset.
 */
type ViewerState = {
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  toggleInfo: () => void;
  /** Unsaved AI transformation preview, rendered on the stage instead of the original. */
  aiPreview: AiPreview | null;
  /** When a preview exists, lets the user flip back to the original for comparison. */
  showOriginal: boolean;
  setAiPreview: (preview: AiPreview | null) => void;
  setShowOriginal: (showOriginal: boolean) => void;
};

export const useViewerStore = create<ViewerState>((set) => ({
  infoOpen: false,
  setInfoOpen: (open) => set({ infoOpen: open }),
  toggleInfo: () => set((state) => ({ infoOpen: !state.infoOpen })),
  aiPreview: null,
  showOriginal: false,
  setAiPreview: (preview) => set({ aiPreview: preview, showOriginal: false }),
  setShowOriginal: (showOriginal) => set({ showOriginal }),
}));
