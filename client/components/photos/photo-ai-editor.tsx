"use client";

import { useState } from "react";
import Image from "next/image";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAiApply, useAiPreview } from "@/hooks/use-ai";
import type { AiTransformType } from "@/lib/api";

const transformOptions: Array<{ value: AiTransformType; label: string }> = [
  { value: "REMOVE_BACKGROUND", label: "Remove background" },
  { value: "BACKGROUND_AND_SHADOW", label: "Background and shadow" },
  { value: "CHANGE_BACKGROUND", label: "Change background" },
  { value: "GENERATIVE_FILL", label: "Generative fill" },
  { value: "SMART_CROP", label: "Smart crop" },
  { value: "RETOUCH", label: "Retouch" },
  { value: "UPSCALE", label: "Upscale" },
];

export function PhotoAiEditor({ photoId }: { photoId: string }) {
  const [type, setType] = useState<AiTransformType>("REMOVE_BACKGROUND");
  const [prompt, setPrompt] = useState("");
  const previewMutation = useAiPreview(photoId);
  const applyMutation = useAiApply(photoId);
  const preview = previewMutation.data;

  const request = { type, ...(prompt.trim() ? { prompt: prompt.trim() } : {}) };

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2">
        <WandSparkles className="size-4 text-primary" />
        <h2 className="font-medium">AI editor</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ai-transform">Edit</Label>
            <select
              id="ai-transform"
              value={type}
              onChange={(event) => setType(event.target.value as AiTransformType)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {transformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Prompt (optional)</Label>
            <Input
              id="ai-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the desired result"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate(request)}
              disabled={previewMutation.isPending || applyMutation.isPending}
            >
              {previewMutation.isPending ? <Spinner /> : "Preview"}
            </Button>
            <Button
              onClick={() => applyMutation.mutate(request)}
              disabled={applyMutation.isPending || previewMutation.isPending}
            >
              {applyMutation.isPending ? <Spinner /> : "Save as new photo"}
            </Button>
          </div>
        </div>
        {preview && (
          <div className="relative min-h-48 overflow-hidden rounded-lg bg-muted">
            <Image
              src={preview.previewUrl}
              alt="AI edit preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
      </div>
    </section>
  );
}
