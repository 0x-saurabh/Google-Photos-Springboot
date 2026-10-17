"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NumberFieldProps = {
  id: string;
  label: string;
  value: number | undefined;
  min: number;
  max: number;
  /** Allow clearing the field, reported as `undefined`. */
  optional?: boolean;
  suffix?: string;
  /** `transient` is true while typing and false once the field is left. */
  onChange: (value: number | undefined, transient: boolean) => void;
};

/**
 * Integer input that updates the pipeline as you type (transiently, so a run
 * of keystrokes becomes one undo entry) and commits on blur or Enter.
 */
export function NumberField({ id, label, value, min, max, optional = false, suffix, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? "" : String(value));

  const parse = (text: string): number | undefined => {
    if (text.trim() === "") return undefined;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  };

  const commit = () => {
    const parsed = parse(shown);
    if (parsed === undefined) {
      onChange(optional ? undefined : value, false);
    } else {
      onChange(Math.min(max, Math.max(min, parsed)), false);
    }
    setDraft(null);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {suffix && <span className="text-muted-foreground"> ({suffix})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={shown}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parse(event.target.value);
          if (parsed !== undefined || optional) onChange(parsed, true);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="h-8 text-sm tabular-nums"
      />
    </div>
  );
}
