"use client";

import {
  Circle,
  Contrast,
  Crop,
  Droplets,
  Expand,
  FlipHorizontal2,
  Focus,
  Frame,
  ImageMinus,
  Layers,
  MessageSquareText,
  Palette,
  Proportions,
  RotateCw,
  Scaling,
  Scan,
  Scissors,
  Sparkles,
  SquareDashed,
  SquareRoundCorner,
  SunMedium,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EditOp } from "@/lib/api";
import { TOOLS, type ToolGroup } from "@/lib/edit-steps";
import { cn } from "@/lib/utils";

const icons: Record<EditOp, LucideIcon> = {
  CROP: Crop,
  ASPECT_CROP: Proportions,
  RESIZE: Scaling,
  ROTATE: RotateCw,
  FLIP: FlipHorizontal2,
  TRIM: Scissors,
  GRAYSCALE: Palette,
  CONTRAST: Contrast,
  SHARPEN: SunMedium,
  BLUR: Droplets,
  RADIUS: SquareRoundCorner,
  ROUND: Circle,
  BORDER: Frame,
  OPACITY: Layers,
  REMOVE_BACKGROUND: ImageMinus,
  BACKGROUND_AND_SHADOW: SquareDashed,
  CHANGE_BACKGROUND: Wand2,
  AI_EDIT: MessageSquareText,
  GENERATIVE_FILL: Expand,
  SMART_CROP: Scan,
  OBJECT_CROP: Focus,
  RETOUCH: Sparkles,
  UPSCALE: Expand,
};

const groups: Array<{ id: ToolGroup; label: string }> = [
  { id: "transform", label: "Transform" },
  { id: "enhance", label: "Enhance" },
  { id: "ai", label: "AI" },
];

type ToolCatalogProps = {
  activeOps: Set<EditOp>;
  onAdd: (op: EditOp) => void;
};

/** Tabbed grid of every available operation. */
export function ToolCatalog({ activeOps, onAdd }: ToolCatalogProps) {
  return (
    <Tabs defaultValue="transform">
      <TabsList className="w-full">
        {groups.map((group) => (
          <TabsTrigger key={group.id} value={group.id}>
            {group.id === "ai" && <Sparkles data-icon="inline-start" className="size-3.5" />}
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group.id} value={group.id} className="mt-2">
          {group.id === "ai" && (
            <p className="mb-2 rounded-lg bg-accent/60 px-3 py-2 text-[11px] leading-relaxed text-accent-foreground">
              AI steps run on ImageKit and use AI credits each time a preview is generated or a result is saved.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-1.5">
            {TOOLS.filter((tool) => tool.group === group.id).map((tool) => {
              const Icon = icons[tool.op];
              const active = tool.single && activeOps.has(tool.op);
              return (
                <li key={tool.op}>
                  <button
                    type="button"
                    onClick={() => onAdd(tool.op)}
                    aria-pressed={active}
                    title={tool.description}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      active
                        ? "border-primary/40 bg-accent text-accent-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{tool.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      ))}
    </Tabs>
  );
}
