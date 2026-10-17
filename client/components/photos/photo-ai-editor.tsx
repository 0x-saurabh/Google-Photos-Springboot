"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAiApply, useAiPreview } from "@/hooks/use-ai";
import type { AiTransformRequest, AiTransformType, Photo } from "@/lib/api";
import { useViewerStore } from "@/stores/viewer-store";

/**
 * Mirrors the backend's AiTransformService.buildTransformChain: which fields
 * each ImageKit transformation needs, and the dimension bounds it enforces.
 */
type TransformOption = {
  value: AiTransformType;
  label: string;
  hint: string;
  prompt: "required" | "optional" | "none";
  dimensions: boolean;
  focusObject: boolean;
};

const transformOptions: TransformOption[] = [
  { value: "REMOVE_BACKGROUND", label: "Remove background", hint: "Keeps the subject on a transparent canvas.", prompt: "none", dimensions: false, focusObject: false },
  { value: "BACKGROUND_AND_SHADOW", label: "Background and shadow", hint: "Removes the background and adds a soft drop shadow.", prompt: "none", dimensions: false, focusObject: false },
  { value: "CHANGE_BACKGROUND", label: "Change background", hint: "Replaces the background with a scene you describe.", prompt: "required", dimensions: false, focusObject: false },
  { value: "AI_EDIT", label: "Edit with a prompt", hint: "Describe the change you want made to the photo.", prompt: "required", dimensions: false, focusObject: false },
  { value: "GENERATIVE_FILL", label: "Generative fill", hint: "Extends the photo to the target size and fills the new area.", prompt: "optional", dimensions: true, focusObject: false },
  { value: "SMART_CROP", label: "Smart crop", hint: "Crops to the target size around the most interesting region.", prompt: "none", dimensions: true, focusObject: false },
  { value: "OBJECT_CROP", label: "Crop to an object", hint: "Crops around a named object, for example “face” or “car”.", prompt: "none", dimensions: false, focusObject: true },
  { value: "RETOUCH", label: "Retouch", hint: "Cleans up blemishes and noise.", prompt: "none", dimensions: false, focusObject: false },
  { value: "UPSCALE", label: "Upscale", hint: "Increases resolution while preserving detail.", prompt: "none", dimensions: false, focusObject: false },
];

const MIN_DIMENSION = 64;
const MAX_DIMENSION = 4096;

function clampDimension(value: number | null | undefined, fallback: number) {
  if (!value || Number.isNaN(value)) return fallback;
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)));
}

type Validation =
  | { ok: true; request: AiTransformRequest }
  | { ok: false; message: string };

function buildRequest(
  option: TransformOption,
  fields: { prompt: string; width: string; height: string; focusObject: string },
): Validation {
  const request: AiTransformRequest = { type: option.value };
  const prompt = fields.prompt.trim();

  if (option.prompt === "required" && !prompt) {
    return { ok: false, message: "Add a prompt describing the result you want." };
  }
  if (option.prompt !== "none" && prompt) {
    request.prompt = prompt;
  }

  if (option.dimensions) {
    const width = Number(fields.width);
    const height = Number(fields.height);
    const inRange = (n: number) => Number.isInteger(n) && n >= MIN_DIMENSION && n <= MAX_DIMENSION;
    if (!inRange(width) || !inRange(height)) {
      return {
        ok: false,
        message: `Width and height must be whole numbers between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels.`,
      };
    }
    request.width = width;
    request.height = height;
  }

  if (option.focusObject) {
    const focusObject = fields.focusObject.trim();
    if (!focusObject) {
      return { ok: false, message: "Name the object to crop around." };
    }
    request.focusObject = focusObject;
  }

  return { ok: true, request };
}

/**
 * ImageKit AI transformations for one photo.
 * Preview builds a transformed URL and shows it on the viewer stage; nothing
 * is stored. Saving downloads the result and stores it as a new photo, so the
 * original is never modified. Mount with `key={photo.id}` so form state resets per photo.
 */
export function PhotoAiEditor({ photo }: { photo: Photo }) {
  const router = useRouter();
  const [type, setType] = useState<AiTransformType>("REMOVE_BACKGROUND");
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(() => String(clampDimension(photo.width, 1024)));
  const [height, setHeight] = useState(() => String(clampDimension(photo.height, 1024)));
  const [focusObject, setFocusObject] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const previewMutation = useAiPreview(photo.id);
  const applyMutation = useAiApply(photo.id);
  const aiPreview = useViewerStore((state) => state.aiPreview);
  const setAiPreview = useViewerStore((state) => state.setAiPreview);

  const option = useMemo(
    () => transformOptions.find((entry) => entry.value === type) ?? transformOptions[0],
    [type],
  );
  const busy = previewMutation.isPending || applyMutation.isPending;
  const hasPreview = aiPreview?.photoId === photo.id;

  function validate(): AiTransformRequest | null {
    const result = buildRequest(option, { prompt, width, height, focusObject });
    if (!result.ok) {
      setValidationError(result.message);
      return null;
    }
    setValidationError(null);
    return result.request;
  }

  function handlePreview() {
    const request = validate();
    if (!request) return;
    previewMutation.mutate(request, {
      onSuccess: (data) =>
        setAiPreview({ photoId: photo.id, url: data.previewUrl, label: option.label }),
    });
  }

  function handleApply() {
    const request = validate();
    if (!request) return;
    applyMutation.mutate(request, {
      onSuccess: (created) => {
        setAiPreview(null);
        router.push(`/photos/${created.id}`);
      },
    });
  }

  return (
    <section className="space-y-4" aria-labelledby="ai-editor-heading">
      <div className="flex items-center gap-2">
        <WandSparkles className="size-4 text-primary" aria-hidden="true" />
        <h3 id="ai-editor-heading" className="text-sm font-medium text-foreground">
          Edit with AI
        </h3>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Powered by ImageKit transformations. Preview is free to try; saving creates a new photo
        and leaves this one untouched.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="ai-transform">Transformation</Label>
        <Select
          value={type}
          onValueChange={(value) => {
            if (!value) return;
            setType(value as AiTransformType);
            setValidationError(null);
          }}
          items={transformOptions.map((entry) => ({ value: entry.value, label: entry.label }))}
        >
          <SelectTrigger id="ai-transform" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {transformOptions.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{option.hint}</p>
      </div>

      {option.prompt !== "none" && (
        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">
            Prompt{option.prompt === "optional" ? " (optional)" : ""}
          </Label>
          <Input
            id="ai-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              option.value === "AI_EDIT"
                ? "e.g. make it look like winter"
                : "e.g. a quiet beach at golden hour"
            }
            aria-required={option.prompt === "required"}
          />
        </div>
      )}

      {option.dimensions && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ai-width">Width (px)</Label>
            <Input
              id="ai-width"
              type="number"
              inputMode="numeric"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={width}
              onChange={(event) => setWidth(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-height">Height (px)</Label>
            <Input
              id="ai-height"
              type="number"
              inputMode="numeric"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </div>
          {photo.width && photo.height && (
            <p className="col-span-2 text-xs text-muted-foreground">
              Original is {photo.width} × {photo.height}.
            </p>
          )}
        </div>
      )}

      {option.focusObject && (
        <div className="space-y-1.5">
          <Label htmlFor="ai-focus">Object to keep</Label>
          <Input
            id="ai-focus"
            value={focusObject}
            onChange={(event) => setFocusObject(event.target.value)}
            placeholder="e.g. face, dog, car"
            aria-required
          />
        </div>
      )}

      {validationError && (
        <p role="alert" className="text-xs text-destructive">
          {validationError}
        </p>
      )}

      {hasPreview && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-accent/60 px-3 py-2 text-xs">
          <span className="text-accent-foreground">
            Previewing <span className="font-medium">{aiPreview.label}</span> on the left. Not saved.
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Discard preview"
            onClick={() => setAiPreview(null)}
          >
            <X />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handlePreview} disabled={busy}>
          {previewMutation.isPending ? <Spinner className="size-3.5" /> : null}
          Preview
        </Button>
        <Button size="sm" onClick={handleApply} disabled={busy}>
          {applyMutation.isPending ? <Spinner className="size-3.5" /> : null}
          {applyMutation.isPending ? "Saving" : "Save as new photo"}
        </Button>
      </div>
    </section>
  );
}
