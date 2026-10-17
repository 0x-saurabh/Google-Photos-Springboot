"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Redo2, RotateCcw, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { CompareMode } from "@/components/editor/compare-slider";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { OutputPanel } from "@/components/editor/output-panel";
import { PipelineList } from "@/components/editor/pipeline-list";
import { StepInspector } from "@/components/editor/step-inspector";
import { ToolCatalog } from "@/components/editor/tool-catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePhoto } from "@/hooks/use-ai";
import { useEditApply, useEditPreview } from "@/hooks/use-edit";
import type { EditOp, Photo } from "@/lib/api";
import { downloadUrl } from "@/lib/download";
import { cn } from "@/lib/utils";
import { selectIsDirty, useEditorStore } from "@/stores/editor-store";

type PhotoEditorProps = {
  photoId: string;
  /** Where "Back" goes; normally the viewer with the same list context. */
  backHref: string;
};

const headerButton =
  "text-stage-foreground/85 hover:bg-white/10 hover:text-stage-foreground dark:hover:bg-white/10 disabled:opacity-30";

/**
 * Non-destructive editing workspace. The pipeline lives in a store so it
 * survives re-renders; previews are rendered by ImageKit from the original and
 * saving stores the result as a new photo next to the source.
 */
export function PhotoEditor({ photoId, backHref }: PhotoEditorProps) {
  const { data: photo, isLoading, isError, error, refetch, isRefetching } = usePhoto(photoId);

  useEffect(() => {
    useEditorStore.getState().open(photoId);
  }, [photoId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground" role="dialog" aria-modal="true" aria-label="Photo editor">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center bg-stage">
          <Spinner className="size-6 text-stage-foreground/60" />
        </div>
      ) : isError || !photo ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <ErrorState
              title="This photo could not be loaded"
              description={error instanceof Error ? error.message : "It may have been deleted."}
              onRetry={() => refetch()}
              retrying={isRefetching}
            />
            <div className="mt-4 text-center">
              <Link href={backHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <ArrowLeft />
                Back
              </Link>
            </div>
          </div>
        </div>
      ) : photo.status === "TRASH" ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <ErrorState title="This photo is in the trash" description="Restore it before editing." />
            <div className="mt-4 text-center">
              <Link href={backHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <ArrowLeft />
                Back
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <EditorWorkspace key={photo.id} photo={photo} backHref={backHref} />
      )}
    </div>
  );
}

function EditorWorkspace({ photo, backHref }: { photo: Photo; backHref: string }) {
  const router = useRouter();
  const steps = useEditorStore((state) => state.steps);
  const output = useEditorStore((state) => state.output);
  const selectedId = useEditorStore((state) => state.selectedId);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const isDirty = useEditorStore(selectIsDirty);
  const { addStep, updateStep, removeStep, moveStep, select, setOutput, undo, redo, reset, clear } =
    useEditorStore.getState();

  const [mode, setMode] = useState<CompareMode>("after");
  const [cropAspect, setCropAspect] = useState("free");
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmAiSave, setConfirmAiSave] = useState(false);

  const preview = useEditPreview(photo, steps, output);
  const apply = useEditApply(photo.id);

  const selectedStep = useMemo(() => steps.find((step) => step.id === selectedId) ?? null, [steps, selectedId]);
  const activeOps = useMemo(() => new Set<EditOp>(steps.map((step) => step.op)), [steps]);
  const hasPreview = preview.previewUrl !== null;

  // Warn before the tab closes with unsaved work.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z" && !typing) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (meta && event.key.toLowerCase() === "y" && !typing) {
        event.preventDefault();
        redo();
      } else if (event.key === "Escape" && !typing) {
        if (useEditorStore.getState().selectedId) select(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, select, undo]);

  const leave = useCallback(() => {
    clear();
    router.push(backHref);
  }, [backHref, clear, router]);

  const requestLeave = () => {
    if (isDirty) setConfirmLeave(true);
    else leave();
  };

  const save = () => {
    if (!preview.request || preview.invalid) return;
    apply.mutate(preview.request, {
      onSuccess: (created) => {
        clear();
        router.push(`/photos/${created.id}`);
      },
    });
  };

  const requestSave = () => {
    if (preview.invalid) {
      select(preview.invalid.stepId);
      toast.error(preview.invalid.message);
      return;
    }
    if (preview.usesAi) setConfirmAiSave(true);
    else save();
  };

  const download = () => {
    if (preview.downloadUrl) {
      downloadUrl(preview.downloadUrl, `${photo.fileName.replace(/\.[^.]+$/, "")}-edited`);
    } else {
      downloadUrl(photo.url, photo.fileName);
    }
  };

  const panel = (
    <div className="space-y-5">
      <section aria-labelledby="pipeline-heading" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="pipeline-heading" className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Steps
          </h2>
          {steps.length > 0 && (
            <Button variant="ghost" size="xs" onClick={reset}>
              <RotateCcw />
              Clear all
            </Button>
          )}
        </div>
        <PipelineList
          steps={steps}
          selectedId={selectedId}
          invalidId={preview.invalid?.stepId ?? null}
          onSelect={select}
          onMove={moveStep}
          onRemove={removeStep}
        />
      </section>

      {selectedStep && (
        <StepInspector
          key={selectedStep.id}
          photo={photo}
          step={selectedStep}
          error={preview.invalid?.stepId === selectedStep.id ? preview.invalid.message : null}
          onChange={(patch, transient) => updateStep(selectedStep.id, patch, { transient })}
          onRemove={() => removeStep(selectedStep.id)}
          cropAspect={cropAspect}
          onCropAspectChange={setCropAspect}
        />
      )}

      <section aria-labelledby="tools-heading" className="space-y-2">
        <h2 id="tools-heading" className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Add a step
        </h2>
        <ToolCatalog activeOps={activeOps} onAdd={(op) => addStep(photo, op)} />
      </section>

      <Separator />
      <OutputPanel output={output} onChange={(patch, transient) => setOutput(patch, { transient })} />
    </div>
  );

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-white/10 bg-stage px-3 text-stage-foreground sm:px-4">
        <Button variant="ghost" size="sm" className={headerButton} onClick={requestLeave}>
          <ArrowLeft />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="min-w-0 flex-1 px-2 text-center">
          <p className="truncate text-sm">
            <span className="text-stage-foreground/90">{photo.fileName}</span>
            <span className="ml-2 hidden text-stage-foreground/50 tabular-nums md:inline">
              {photo.width && photo.height ? `${photo.width} × ${photo.height}` : ""}
              {previewSize && hasPreview && ` → ${previewSize.width} × ${previewSize.height}`}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={headerButton} aria-label="Undo" onClick={undo} disabled={!canUndo} />}>
              <Undo2 />
            </TooltipTrigger>
            <TooltipContent>
              Undo <Kbd>⌘Z</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" className={headerButton} aria-label="Redo" onClick={redo} disabled={!canRedo} />}>
              <Redo2 />
            </TooltipTrigger>
            <TooltipContent>
              Redo <Kbd>⇧⌘Z</Kbd>
            </TooltipContent>
          </Tooltip>

          <ToggleGroup
            value={[mode]}
            onValueChange={(values) => {
              const next = Array.isArray(values) ? values[values.length - 1] : values;
              if (next === "before" || next === "after" || next === "compare") setMode(next);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="mx-1 hidden border-white/15 sm:flex [&_button]:border-white/15 [&_button]:text-stage-foreground/80 [&_button]:hover:bg-white/10 [&_button]:hover:text-stage-foreground [&_button[data-pressed]]:bg-white/20 [&_button[data-pressed]]:text-stage-foreground"
            aria-label="View"
          >
            <ToggleGroupItem value="before" disabled={!hasPreview}>
              Before
            </ToggleGroupItem>
            <ToggleGroupItem value="compare" disabled={!hasPreview}>
              Compare
            </ToggleGroupItem>
            <ToggleGroupItem value="after" disabled={!hasPreview}>
              After
            </ToggleGroupItem>
          </ToggleGroup>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={headerButton}
                  aria-label={hasPreview ? "Download edited image" : "Download original"}
                  onClick={download}
                  disabled={isDirty && !hasPreview}
                />
              }
            >
              <Download />
            </TooltipTrigger>
            <TooltipContent>{hasPreview ? "Download edited image" : "Download original"}</TooltipContent>
          </Tooltip>

          <Button size="sm" className="ml-1" onClick={requestSave} disabled={!isDirty || apply.isPending || !!preview.invalid}>
            {apply.isPending ? <Spinner className="size-3.5" /> : <Save />}
            {apply.isPending ? "Saving" : "Save as new"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className={cn("relative min-h-0 flex-1 bg-stage text-stage-foreground", "h-[48svh] shrink-0 lg:h-auto lg:shrink")}>
          <EditorCanvas
            photo={photo}
            preview={preview}
            mode={mode}
            selectedStep={selectedStep}
            cropAspect={cropAspect}
            onCropChange={(rect, transient) => selectedStep && updateStep(selectedStep.id, rect, { transient })}
            onPreviewSize={setPreviewSize}
          />
        </div>
        <aside className="scrollbar-thin min-h-0 flex-1 overflow-y-auto border-t border-border bg-background p-4 lg:w-[22rem] lg:flex-none lg:border-t-0 lg:border-l">
          {panel}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Discard these edits?"
        description="Nothing has been saved yet. Leaving the editor throws away the current steps."
        confirmLabel="Discard and leave"
        destructive
        onConfirm={() => {
          setConfirmLeave(false);
          leave();
        }}
      />

      <ConfirmDialog
        open={confirmAiSave}
        onOpenChange={setConfirmAiSave}
        title="Save with AI steps?"
        description="Rendering this result uses ImageKit AI credits. The result is stored as a new photo; the original stays untouched."
        confirmLabel="Save as new photo"
        pending={apply.isPending}
        onConfirm={() => {
          setConfirmAiSave(false);
          save();
        }}
      />
    </>
  );
}
