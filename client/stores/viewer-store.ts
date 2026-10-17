import { create } from "zustand";

/**
 * Viewer preferences that should survive stepping between photos.
 * Each photo is its own route, so component state alone would reset.
 */
type ViewerState = {
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  toggleInfo: () => void;
};

export const useViewerStore = create<ViewerState>((set) => ({
  infoOpen: false,
  setInfoOpen: (open) => set({ infoOpen: open }),
  toggleInfo: () => set((state) => ({ infoOpen: !state.infoOpen })),
}));
