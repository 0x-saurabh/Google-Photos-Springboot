import { create } from "zustand";

type PhotoSelectionState = {
  isSelectMode: boolean;
  selectedIds: string[];
  /** Last photo toggled, used as the anchor for shift-click ranges. */
  anchorId: string | null;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  togglePhoto: (photoId: string) => void;
  /** Selects every id between the anchor and `photoId` in `orderedIds`. */
  selectRange: (photoId: string, orderedIds: string[]) => void;
  selectAll: (photoIds: string[]) => void;
  clearSelection: () => void;
};

export const usePhotoSelectionStore = create<PhotoSelectionState>((set, get) => ({
  isSelectMode: false,
  selectedIds: [],
  anchorId: null,
  enterSelectMode: () => set({ isSelectMode: true }),
  exitSelectMode: () => set({ isSelectMode: false, selectedIds: [], anchorId: null }),
  togglePhoto: (photoId) => {
    const { selectedIds } = get();
    const next = selectedIds.includes(photoId)
      ? selectedIds.filter((id) => id !== photoId)
      : [...selectedIds, photoId];
    set({ selectedIds: next, anchorId: photoId, isSelectMode: true });
  },
  selectRange: (photoId, orderedIds) => {
    const { anchorId, selectedIds } = get();
    const anchorIndex = anchorId ? orderedIds.indexOf(anchorId) : -1;
    const targetIndex = orderedIds.indexOf(photoId);
    if (anchorIndex === -1 || targetIndex === -1) {
      get().togglePhoto(photoId);
      return;
    }
    const [start, end] =
      anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
    const range = orderedIds.slice(start, end + 1);
    const merged = Array.from(new Set([...selectedIds, ...range]));
    set({ selectedIds: merged, isSelectMode: true });
  },
  selectAll: (photoIds) => set({ selectedIds: photoIds, isSelectMode: true }),
  clearSelection: () => set({ selectedIds: [], anchorId: null }),
}));
