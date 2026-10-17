import { create } from "zustand";
import type { EditOutput, Photo } from "@/lib/api";
import { DEFAULT_OUTPUT, outputIsDefault, toolFor, type EditorStep } from "@/lib/edit-steps";

type Snapshot = { steps: EditorStep[]; output: EditOutput };

type EditorState = Snapshot & {
  photoId: string | null;
  selectedId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  /** Snapshot taken before a run of transient (drag) updates, committed as one undo entry. */
  transientOrigin: Snapshot | null;
  /** Resets the pipeline when opening a different photo. */
  open: (photoId: string) => void;
  addStep: (photo: Photo, op: EditorStep["op"]) => void;
  updateStep: (id: string, patch: Partial<EditorStep>, options?: { transient?: boolean }) => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, direction: -1 | 1) => void;
  select: (id: string | null) => void;
  setOutput: (patch: EditOutput, options?: { transient?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  /** Clears the pipeline as an undoable action. */
  reset: () => void;
  /** Forgets everything, including history; used after a save or when leaving. */
  clear: () => void;
};

let counter = 0;
const nextId = () => `step-${Date.now().toString(36)}-${counter++}`;

const empty: Snapshot = { steps: [], output: DEFAULT_OUTPUT };

export const useEditorStore = create<EditorState>((set, get) => {
  /** Applies a change and records the previous state for undo. */
  const commit = (next: Partial<Snapshot>, options?: { transient?: boolean }) => {
    const state = get();
    const current: Snapshot = { steps: state.steps, output: state.output };
    if (options?.transient) {
      set({ ...next, transientOrigin: state.transientOrigin ?? current });
      return;
    }
    const origin = state.transientOrigin ?? current;
    set({ ...next, past: [...state.past, origin].slice(-100), future: [], transientOrigin: null });
  };

  return {
    ...empty,
    photoId: null,
    selectedId: null,
    past: [],
    future: [],
    transientOrigin: null,

    open: (photoId) => {
      if (get().photoId === photoId) return;
      set({ ...empty, photoId, selectedId: null, past: [], future: [], transientOrigin: null });
    },

    addStep: (photo, op) => {
      const tool = toolFor(op);
      const { steps } = get();
      const existing = tool.single ? steps.find((step) => step.op === op) : undefined;
      if (existing) {
        set({ selectedId: existing.id });
        return;
      }
      const step: EditorStep = { id: nextId(), op, ...tool.defaults(photo) };
      // A manual crop works in original-image pixels, so it always runs first.
      const next = op === "CROP" ? [step, ...steps] : [...steps, step];
      commit({ steps: next });
      set({ selectedId: step.id });
    },

    updateStep: (id, patch, options) => {
      const steps = get().steps.map((step) => (step.id === id ? { ...step, ...patch } : step));
      commit({ steps }, options);
    },

    removeStep: (id) => {
      const state = get();
      commit({ steps: state.steps.filter((step) => step.id !== id) });
      if (state.selectedId === id) set({ selectedId: null });
    },

    moveStep: (id, direction) => {
      const steps = [...get().steps];
      const index = steps.findIndex((step) => step.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= steps.length) return;
      // Keep the manual crop pinned to the front.
      if (steps[index].op === "CROP" || steps[target].op === "CROP") return;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      commit({ steps });
    },

    select: (id) => set({ selectedId: id }),

    setOutput: (patch, options) => commit({ output: { ...get().output, ...patch } }, options),

    undo: () => {
      const { past, future, steps, output } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        ...previous,
        past: past.slice(0, -1),
        future: [{ steps, output }, ...future].slice(0, 100),
        transientOrigin: null,
      });
    },

    redo: () => {
      const { past, future, steps, output } = get();
      const [next, ...rest] = future;
      if (!next) return;
      set({ ...next, past: [...past, { steps, output }], future: rest, transientOrigin: null });
    },

    reset: () => commit({ ...empty }),

    clear: () =>
      set({ ...empty, photoId: null, selectedId: null, past: [], future: [], transientOrigin: null }),
  };
});

export const selectIsDirty = (state: EditorState) =>
  state.steps.length > 0 || !outputIsDefault(state.output);
