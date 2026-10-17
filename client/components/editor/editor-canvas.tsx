"use client";

import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { CompareSlider, type CompareMode } from "@/components/editor/compare-slider";
import { CropOverlay, type CropRect } from "@/components/editor/crop-overlay";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { EditPreviewState } from "@/hooks/use-edit";
import type { Photo } from "@/lib/api";
import { parseAspectRatio, type EditorStep } from "@/lib/edit-steps";

type EditorCanvasProps = {
  photo: Photo;
  preview: EditPreviewState;
  mode: CompareMode;
  /** The step being edited; a selected crop switches the canvas into crop mode. */
  selectedStep: EditorStep | null;
  cropAspect: string;
  onCropChange: (rect: CropRect, transient: boolean) => void;
  /** Reported when the rendered preview loads, so the header can show its size. */
  onPreviewSize: (size: { width: number; height: number } | null) => void;
};

export function EditorCanvas({
  photo,
  preview,
  mode,
  selectedStep,
  cropAspect,
  onCropChange,
  onPreviewSize,
}: EditorCanvasProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const cropping = selectedStep?.op === "CROP";
  const previewUrl = preview.previewUrl;
  const imageLoading = previewUrl !== null && loadedSrc !== previewUrl && failedSrc !== previewUrl;
  const renderFailed = previewUrl !== null && failedSrc === previewUrl;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-3 sm:p-6">
      {cropping && selectedStep ? (
        <CropOverlay
          photo={photo}
          value={{
            x: selectedStep.x ?? 0,
            y: selectedStep.y ?? 0,
            width: selectedStep.width ?? 1,
            height: selectedStep.height ?? 1,
          }}
          aspect={parseAspectRatio(cropAspect)}
          onChange={onCropChange}
        />
      ) : (
        <CompareSlider
          beforeSrc={photo.url}
          afterSrc={renderFailed ? null : previewUrl}
          alt={photo.fileName}
          mode={mode}
          onAfterLoad={(size) => {
            setLoadedSrc(previewUrl);
            onPreviewSize(size);
          }}
          onAfterError={() => {
            setFailedSrc(previewUrl);
            onPreviewSize(null);
          }}
        />
      )}

      {!cropping && (preview.isFetching || imageLoading) && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            <Spinner className="size-3.5" />
            {preview.usesAi ? "Generating with AI" : "Rendering preview"}
          </span>
        </div>
      )}

      {!cropping && preview.needsGenerate && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-center text-xs text-white backdrop-blur-sm">
            <p>This pipeline includes AI steps. Generating a preview uses ImageKit AI credits.</p>
            <Button size="sm" onClick={preview.generate}>
              <Sparkles />
              Generate preview
            </Button>
          </div>
        </div>
      )}

      {!cropping && (preview.error || renderFailed || preview.invalid) && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4" role="alert">
          <p className="inline-flex max-w-md items-center gap-2 rounded-xl border border-red-400/30 bg-black/70 px-4 py-2 text-xs text-red-100 backdrop-blur-sm">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {preview.invalid
              ? preview.invalid.message
              : preview.error
                ? preview.error.message
                : "ImageKit couldn't render this combination. Try removing the last step."}
          </p>
        </div>
      )}
    </div>
  );
}
