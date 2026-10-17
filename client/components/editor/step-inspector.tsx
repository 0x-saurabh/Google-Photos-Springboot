"use client";

import { Trash2 } from "lucide-react";
import { NumberField } from "@/components/editor/number-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Photo } from "@/lib/api";
import {
  AI_MIN_DIMENSION,
  ASPECT_PRESETS,
  FIT_OPTIONS,
  FOCUS_OPTIONS,
  MAX_DIMENSION,
  MIN_DIMENSION,
  SIZE_PRESETS,
  parseAspectRatio,
  toolFor,
  type EditorStep,
} from "@/lib/edit-steps";

type StepInspectorProps = {
  photo: Photo;
  step: EditorStep;
  error: string | null;
  onChange: (patch: Partial<EditorStep>, transient?: boolean) => void;
  onRemove: () => void;
  /** CROP only: aspect lock used by the on-canvas overlay. */
  cropAspect?: string;
  onCropAspectChange?: (value: string) => void;
};

function SliderField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number, transient: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next, true)}
        onValueCommitted={(next) => onChange(Array.isArray(next) ? next[0] : next, false)}
        aria-label={label}
      />
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, transient: boolean) => void;
}) {
  const hex = /^[0-9A-Fa-f]{6}$/.test(value) ? `#${value}` : "#000000";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={hex}
          onChange={(event) => onChange(event.target.value.slice(1).toUpperCase(), true)}
          onBlur={() => onChange(value, false)}
          className="size-8 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value.replace("#", "").toUpperCase().slice(0, 6), true)}
          onBlur={() => onChange(value, false)}
          placeholder="FFFFFF"
          className="h-8 font-mono text-sm uppercase"
          maxLength={6}
        />
      </div>
    </div>
  );
}

/** Parameter editor for the selected pipeline step. */
export function StepInspector({
  photo,
  step,
  error,
  onChange,
  onRemove,
  cropAspect = "free",
  onCropAspectChange,
}: StepInspectorProps) {
  const tool = toolFor(step.op);

  const fields = (() => {
    switch (step.op) {
      case "CROP":
        return (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="crop-aspect" className="text-xs">
                Lock ratio
              </Label>
              <NativeSelect className="w-full" id="crop-aspect"
                  value={cropAspect}
                  onChange={(event) => {
                    const next = event.target.value;
                    onCropAspectChange?.(next);
                    const ratio = parseAspectRatio(next);
                    if (ratio && step.width && step.height) {
                      // Shrink the longer side so the region keeps its position.
                      const width = step.width / step.height > ratio ? Math.round(step.height * ratio) : step.width;
                      const height = step.width / step.height > ratio ? step.height : Math.round(step.width / ratio);
                      onChange({ width, height });
                    }
                  }}
                >
                  <NativeSelectOption value="free">Free</NativeSelectOption>
                  {ASPECT_PRESETS.map((preset) => (
                    <NativeSelectOption key={preset} value={preset}>
                      {preset}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="crop-x" label="X" value={step.x} min={0} max={MAX_DIMENSION} onChange={(x, t) => onChange({ x }, t)} />
              <NumberField id="crop-y" label="Y" value={step.y} min={0} max={MAX_DIMENSION} onChange={(y, t) => onChange({ y }, t)} />
              <NumberField id="crop-w" label="Width" value={step.width} min={MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(width, t) => onChange({ width }, t)} />
              <NumberField id="crop-h" label="Height" value={step.height} min={MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(height, t) => onChange({ height }, t)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Drag the region on the image, or nudge it with the arrow keys. The crop always runs first so these are original-image pixels
              {photo.width && photo.height ? ` (${photo.width} × ${photo.height}).` : "."}
            </p>
          </>
        );
      case "ASPECT_CROP":
        return (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Ratio</Label>
              <ToggleGroup
                value={ASPECT_PRESETS.includes(step.aspectRatio as (typeof ASPECT_PRESETS)[number]) ? [step.aspectRatio!] : []}
                onValueChange={(values) => {
                  const next = Array.isArray(values) ? values[values.length - 1] : values;
                  if (typeof next === "string" && next) onChange({ aspectRatio: next });
                }}
                variant="outline"
                size="sm"
                className="flex-wrap"
                aria-label="Aspect ratio presets"
              >
                {ASPECT_PRESETS.map((preset) => (
                  <ToggleGroupItem key={preset} value={preset} aria-label={preset}>
                    {preset}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aspect-custom" className="text-xs">
                Custom ratio
              </Label>
              <Input
                id="aspect-custom"
                value={step.aspectRatio ?? ""}
                onChange={(event) => onChange({ aspectRatio: event.target.value.trim() }, true)}
                onBlur={() => onChange({ aspectRatio: step.aspectRatio })}
                placeholder="16:9"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aspect-focus" className="text-xs">
                Keep
              </Label>
              <NativeSelect className="w-full" id="aspect-focus" value={step.focus ?? "auto"} onChange={(event) => onChange({ focus: event.target.value })}>
                  {FOCUS_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
            </div>
          </>
        );
      case "RESIZE":
        return (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="resize-preset" className="text-xs">
                Preset
              </Label>
              <NativeSelect className="w-full" id="resize-preset"
                  value=""
                  onChange={(event) => {
                    const preset = SIZE_PRESETS.find((entry) => entry.label === event.target.value);
                    if (preset) onChange({ width: preset.width, height: preset.height });
                  }}
                >
                  <NativeSelectOption value="">Choose a size…</NativeSelectOption>
                  {SIZE_PRESETS.map((preset) => (
                    <NativeSelectOption key={preset.label} value={preset.label}>
                      {preset.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="resize-w" label="Width" value={step.width} min={MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" optional onChange={(width, t) => onChange({ width }, t)} />
              <NumberField id="resize-h" label="Height" value={step.height} min={MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" optional onChange={(height, t) => onChange({ height }, t)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resize-fit" className="text-xs">
                Fit
              </Label>
              <NativeSelect className="w-full" id="resize-fit" value={step.fit ?? "cover"} onChange={(event) => onChange({ fit: event.target.value })}>
                  {FIT_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
            </div>
            {(step.fit ?? "cover") === "cover" && step.width !== undefined && step.height !== undefined && (
              <div className="space-y-1.5">
                <Label htmlFor="resize-focus" className="text-xs">
                  Keep
                </Label>
                <NativeSelect className="w-full" id="resize-focus" value={step.focus ?? "auto"} onChange={(event) => onChange({ focus: event.target.value })}>
                    {FOCUS_OPTIONS.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
              </div>
            )}
            {step.fit === "pad" && (
              <ColorField id="resize-color" label="Padding colour" value={step.color ?? ""} onChange={(color, t) => onChange({ color }, t)} />
            )}
            <p className="text-xs text-muted-foreground">Leave one side empty to keep the aspect ratio.</p>
          </>
        );
      case "ROTATE":
        return (
          <div className="space-y-1.5">
            <Label className="text-xs">Angle</Label>
            <ToggleGroup
              value={[String(step.rotation ?? 90)]}
              onValueChange={(values) => {
                const next = Array.isArray(values) ? values[values.length - 1] : values;
                if (typeof next === "string" && next) onChange({ rotation: Number(next) });
              }}
              variant="outline"
              size="sm"
              aria-label="Rotation"
            >
              {[90, 180, 270].map((angle) => (
                <ToggleGroupItem key={angle} value={String(angle)} aria-label={`${angle} degrees`}>
                  {angle}°
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        );
      case "FLIP":
        return (
          <div className="space-y-1.5">
            <Label className="text-xs">Direction</Label>
            <ToggleGroup
              value={[step.direction ?? "h"]}
              onValueChange={(values) => {
                const next = Array.isArray(values) ? values[values.length - 1] : values;
                if (typeof next === "string" && next) onChange({ direction: next });
              }}
              variant="outline"
              size="sm"
              aria-label="Flip direction"
            >
              <ToggleGroupItem value="h">Horizontal</ToggleGroupItem>
              <ToggleGroupItem value="v">Vertical</ToggleGroupItem>
              <ToggleGroupItem value="hv">Both</ToggleGroupItem>
            </ToggleGroup>
          </div>
        );
      case "BLUR":
        return <SliderField id="blur" label="Strength" value={step.amount ?? 10} min={1} max={100} onChange={(amount, t) => onChange({ amount }, t)} />;
      case "SHARPEN":
        return <SliderField id="sharpen" label="Strength" value={step.amount ?? 3} min={1} max={10} onChange={(amount, t) => onChange({ amount }, t)} />;
      case "RADIUS":
        return <SliderField id="radius" label="Radius" value={step.amount ?? 24} min={1} max={400} suffix=" px" onChange={(amount, t) => onChange({ amount }, t)} />;
      case "OPACITY":
        return (
          <>
            <SliderField id="opacity" label="Opacity" value={step.amount ?? 80} min={0} max={100} suffix="%" onChange={(amount, t) => onChange({ amount }, t)} />
            <p className="text-xs text-muted-foreground">Choose PNG or WebP output to keep the transparency.</p>
          </>
        );
      case "BORDER":
        return (
          <>
            <SliderField id="border" label="Thickness" value={step.amount ?? 12} min={1} max={200} suffix=" px" onChange={(amount, t) => onChange({ amount }, t)} />
            <ColorField id="border-color" label="Colour" value={step.color ?? "FFFFFF"} onChange={(color, t) => onChange({ color }, t)} />
          </>
        );
      case "TRIM":
        return (
          <>
            <NumberField id="trim" label="Threshold" value={step.amount} min={1} max={99} optional onChange={(amount, t) => onChange({ amount }, t)} />
            <p className="text-xs text-muted-foreground">Leave empty to let ImageKit detect the edges automatically.</p>
          </>
        );
      case "CHANGE_BACKGROUND":
      case "AI_EDIT":
      case "GENERATIVE_FILL":
        return (
          <>
            {step.op === "GENERATIVE_FILL" && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="fill-w" label="Width" value={step.width} min={AI_MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(width, t) => onChange({ width }, t)} />
                <NumberField id="fill-h" label="Height" value={step.height} min={AI_MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(height, t) => onChange({ height }, t)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="prompt" className="text-xs">
                Prompt{step.op === "GENERATIVE_FILL" ? " (optional)" : ""}
              </Label>
              <Textarea
                id="prompt"
                value={step.prompt ?? ""}
                onChange={(event) => onChange({ prompt: event.target.value }, true)}
                onBlur={() => onChange({ prompt: step.prompt })}
                placeholder={step.op === "AI_EDIT" ? "e.g. make it look like winter" : step.op === "CHANGE_BACKGROUND" ? "e.g. a quiet beach at golden hour" : "e.g. continue the sky"}
                rows={3}
                maxLength={500}
                className="text-sm"
              />
            </div>
          </>
        );
      case "SMART_CROP":
        return (
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="smart-w" label="Width" value={step.width} min={AI_MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(width, t) => onChange({ width }, t)} />
            <NumberField id="smart-h" label="Height" value={step.height} min={AI_MIN_DIMENSION} max={MAX_DIMENSION} suffix="px" onChange={(height, t) => onChange({ height }, t)} />
          </div>
        );
      case "OBJECT_CROP":
        return (
          <div className="space-y-1.5">
            <Label htmlFor="focus-object" className="text-xs">
              Object to keep
            </Label>
            <Input
              id="focus-object"
              value={step.focusObject ?? ""}
              onChange={(event) => onChange({ focusObject: event.target.value }, true)}
              onBlur={() => onChange({ focusObject: step.focusObject })}
              placeholder="e.g. face, dog, car"
              className="h-8 text-sm"
            />
          </div>
        );
      default:
        return <p className="text-xs text-muted-foreground">This step has no settings.</p>;
    }
  })();

  return (
    <section aria-labelledby="inspector-heading" className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="inspector-heading" className="text-sm font-medium text-foreground">
            {tool.label}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
        </div>
        <Button variant="ghost" size="icon-xs" aria-label={`Remove ${tool.label}`} onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      <div className="space-y-4">{fields}</div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
