"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { EditOutput } from "@/lib/api";
import { FORMAT_OPTIONS } from "@/lib/edit-steps";

type OutputPanelProps = {
  output: EditOutput;
  onChange: (patch: EditOutput, transient?: boolean) => void;
};

/** Format and quality for the rendered file. */
export function OutputPanel({ output, onChange }: OutputPanelProps) {
  const format = output.format ?? "auto";
  const qualityEnabled = output.quality !== undefined;

  return (
    <section aria-labelledby="output-heading" className="space-y-4">
      <h3 id="output-heading" className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        Output
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="output-format" className="text-xs">
          Format
        </Label>
        <NativeSelect className="w-full" id="output-format" value={format} onChange={(event) => onChange({ format: event.target.value })}>
            {FORMAT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        {format === "jpg" && (
          <p className="text-xs text-muted-foreground">JPEG has no transparency; removed backgrounds become black.</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="output-quality-toggle" className="text-xs">
            Set quality
          </Label>
          <Switch
            id="output-quality-toggle"
            checked={qualityEnabled}
            onCheckedChange={(checked) => onChange({ quality: checked ? 80 : undefined })}
          />
        </div>
        {qualityEnabled && (
          <div className="space-y-1.5">
            <Slider
              min={1}
              max={100}
              step={1}
              value={[output.quality ?? 80]}
              onValueChange={(next) => onChange({ quality: Array.isArray(next) ? next[0] : next }, true)}
              onValueCommitted={(next) => onChange({ quality: Array.isArray(next) ? next[0] : next })}
              aria-label="Quality"
            />
            <p className="text-xs text-muted-foreground tabular-nums">{output.quality} of 100</p>
          </div>
        )}
      </div>
    </section>
  );
}
