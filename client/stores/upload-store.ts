import { create } from "zustand";
import { validateUploadFile } from "@/lib/photo-upload";

export type UploadStatus = "queued" | "uploading" | "done" | "error" | "cancelled";

export type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error: string | null;
};

type UploadState = {
  items: UploadItem[];
  /** Validates and queues files. Returns how many were accepted and rejected. */
  enqueue: (files: File[]) => { accepted: number; rejected: UploadItem[] };
  update: (id: string, patch: Partial<Omit<UploadItem, "id" | "file">>) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
};

let counter = 0;
const nextId = () => `upload-${Date.now()}-${counter++}`;

export const useUploadStore = create<UploadState>((set) => ({
  items: [],

  enqueue: (files) => {
    const accepted: UploadItem[] = [];
    const rejected: UploadItem[] = [];

    for (const file of files) {
      const result = validateUploadFile(file);
      const item: UploadItem = {
        id: nextId(),
        file,
        progress: 0,
        status: result.ok ? "queued" : "error",
        error: result.ok ? null : result.reason,
      };
      (result.ok ? accepted : rejected).push(item);
    }

    set((state) => ({ items: [...state.items, ...accepted, ...rejected] }));
    return { accepted: accepted.length, rejected };
  },

  update: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearFinished: () =>
    set((state) => ({
      items: state.items.filter(
        (item) => item.status === "queued" || item.status === "uploading",
      ),
    })),
}));

export const selectActiveUploads = (state: UploadState) =>
  state.items.filter((item) => item.status === "queued" || item.status === "uploading");
