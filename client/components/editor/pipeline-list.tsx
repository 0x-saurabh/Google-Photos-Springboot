"use client";

import { AlertCircle, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { summarizeStep, toolFor, type EditorStep } from "@/lib/edit-steps";
import { cn } from "@/lib/utils";

type PipelineListProps = {
  steps: EditorStep[];
  selectedId: string | null;
  invalidId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
};

/** Ordered list of the steps that make up the edit. */
export function PipelineList({ steps, selectedId, invalidId, onSelect, onMove, onRemove }: PipelineListProps) {
  if (steps.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
        No edits yet. Pick a tool below to add the first step.
      </p>
    );
  }

  return (
    <ol className="space-y-1" aria-label="Edit steps">
      {steps.map((step, index) => {
        const tool = toolFor(step.op);
        const selected = step.id === selectedId;
        const invalid = step.id === invalidId;
        const pinned = step.op === "CROP";
        return (
          <li key={step.id}>
            <div
              className={cn(
                "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition-colors",
                selected ? "border-primary/50 bg-accent/60" : "border-transparent hover:bg-muted/60",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(selected ? null : step.id)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-md"
              >
                <span className="w-4 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    {tool.label}
                    {tool.ai && <Sparkles className="size-3 text-primary" aria-label="Uses AI credits" />}
                    {invalid && <AlertCircle className="size-3 text-destructive" aria-label="Needs attention" />}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{summarizeStep(step)}</span>
                </span>
              </button>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={pinned || index === 0 || steps[index - 1]?.op === "CROP"} onClick={() => onMove(step.id, -1)}>
                  <ChevronUp />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={pinned || index === steps.length - 1} onClick={() => onMove(step.id, 1)}>
                  <ChevronDown />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${tool.label}`} onClick={() => onRemove(step.id)}>
                  <X />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
