"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type EditOutput, type EditRequest, type Photo } from "@/lib/api";
import {
  outputIsDefault,
  stepUsesAi,
  toEditRequest,
  validateStep,
  type EditorStep,
} from "@/lib/edit-steps";
import { libraryKeys, photoKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function firstInvalidStep(steps: EditorStep[], photo: Photo) {
  for (const step of steps) {
    const message = validateStep(step, photo);
    if (message) return { stepId: step.id, message };
  }
  return null;
}

export type EditPreviewState = {
  /** The request that the preview reflects, or null when nothing changes the image. */
  request: EditRequest | null;
  /** Serialised request, used as a stable identity for caching and "armed" tracking. */
  requestKey: string;
  usesAi: boolean;
  /** First invalid step, if any, so the UI can refuse to preview or save. */
  invalid: { stepId: string; message: string } | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  isFetching: boolean;
  error: Error | null;
  /** Previews with AI steps are only generated on request because they spend credits. */
  needsGenerate: boolean;
  generate: () => void;
};

/**
 * Keeps a preview URL in sync with the pipeline. Non-AI pipelines preview
 * automatically (debounced); AI pipelines wait for an explicit generate so the
 * user decides when to spend ImageKit AI credits.
 */
export function useEditPreview(photo: Photo, steps: EditorStep[], output: EditOutput): EditPreviewState {
  const accessToken = useAuthStore((state) => state.accessToken);

  const invalid = useMemo(() => firstInvalidStep(steps, photo), [photo, steps]);

  const request = useMemo(
    () => (steps.length === 0 && outputIsDefault(output) ? null : toEditRequest(steps, output)),
    [steps, output],
  );
  const requestKey = useMemo(() => JSON.stringify(request), [request]);
  const usesAi = steps.some(stepUsesAi);

  const debouncedKey = useDebounced(requestKey, usesAi ? 0 : 350);
  const [armedKey, setArmedKey] = useState<string | null>(null);

  const ready = !invalid && request !== null && debouncedKey === requestKey;
  const enabled = !!accessToken && ready && (!usesAi || armedKey === requestKey);

  const query = useQuery({
    queryKey: photoKeys.editPreview(photo.id, request ?? { steps: [] }),
    queryFn: () => api.previewEdit(photo.id, request!),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return {
    request,
    requestKey,
    usesAi,
    invalid,
    previewUrl: enabled && query.data ? query.data.previewUrl : null,
    downloadUrl: enabled && query.data ? query.data.downloadUrl : null,
    isFetching: enabled && query.isFetching,
    error: enabled && query.error instanceof Error ? query.error : null,
    needsGenerate: usesAi && !invalid && request !== null && armedKey !== requestKey,
    generate: () => setArmedKey(requestKey),
  };
}

export function useEditApply(photoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: EditRequest) => api.applyEdit(photoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
      queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
      toast.success("Saved as a new photo");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Couldn't save the edit");
    },
  });
}

export function usePhotoVersions(photoId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: photoKeys.versions(photoId),
    queryFn: () => api.getPhotoVersions(photoId),
    enabled: !!accessToken && !!photoId,
  });
}
