"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
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
import type { AiTransformType } from "@/lib/api";

const transformOptions: Array<{ value: AiTransformType; label: string; hint: string }> = [
  { value: "REMOVE_BACKGROUND", label: "Remove background", hint: "Keeps the subject on a transparent canvas." },
  { value: "BACKGROUND_AND_SHADOW", label: "Background and shadow", hint: "Removes the background and adds a soft shadow." },
  { value: "CHANGE_BACKGROUND", label: "Change background", hint: "Describe the new background in the prompt." },
  { value: "GENERATIVE_FILL", label: "Generative fill", hint: "Extends the image edges with generated content." },
  { value: "SMART_CROP", label: "Smart crop", hint: "Crops toward the most interesting region." },
  { value: "RETOUCH", label: "Retouch", hint: "Cleans up blemishes and noise." },
  { value: "UPSCALE", label: "Upscale", hint: "Increases resolution while preserving detail." },
];

/**
 * ImageKit AI transformations. Preview is non-destructive; applying stores
 * the result as a new photo so the original is never modified.
 */
export function PhotoAiEditor({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [type, setType] = useState<AiTransformType>("REMOVE_BACKGROUND");
  const [prompt, setPrompt] = useState("");
  const previewMutation = useAiPreview(photoId);
  const applyMutation = useAiApply(photoId);
  const preview = previewMutation.data;
  const selected = transformOptions.find((option) => option.value === type);
  const busy = previewMutation.isPending || applyMutation.isPending;

  const request = { type, ...(prompt.trim() ? { prompt: prompt.trim() } : {}) };

  return (
    <section className="space-y-4" aria-labelledby="ai-editor-heading">
      <div className="flex items-center gap-2">
        <WandSparkles className="size-4 text-primary" aria-hidden="true" />
        <h3 id="ai-editor-heading" className="text-sm font-medium text-foreground">
          Edit with AI
        </h3>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ai-transform">Transformation</Label>
        <Select
          value={type}
          onValueChange={(value) => value && setType(value as AiTransformType)}
          items={transformOptions.map((option) => ({ value: option.value, label: option.label }))}
        >
          <SelectTrigger id="ai-transform" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {transformOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && <p className="text-xs text-muted-foreground">{selected.hint}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ai-prompt">Prompt (optional)</Label>
        <Input
          id="ai-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. a quiet beach at golden hour"
        />
      </div>

      {preview && (
        <figure className="space-y-1.5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
            <Image
              src={preview.previewUrl}
              alt="AI edit preview"
              fill
              sizes="320px"
              className="object-contain"
              unoptimized
            />
          </div>
          <figcaption className="text-xs text-muted-foreground">Preview, not yet saved.</figcaption>
        </figure>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => previewMutation.mutate(request)}
          disabled={busy}
        >
          {previewMutation.isPending ? <Spinner className="size-3.5" /> : null}
          Preview
        </Button>
        <Button
          size="sm"
          onClick={() =>
            applyMutation.mutate(request, {
              onSuccess: (photo) => router.push(`/photos/${photo.id}`),
            })
          }
          disabled={busy}
        >
          {applyMutation.isPending ? <Spinner className="size-3.5" /> : null}
          Save as new photo
        </Button>
      </div>
    </section>
  );
}
