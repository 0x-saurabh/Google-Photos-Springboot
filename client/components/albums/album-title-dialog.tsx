"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  title: z.string().trim().min(1, "Give the album a title").max(120, "Keep it under 120 characters"),
});

type FormValues = z.infer<typeof schema>;

type AlbumTitleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  initialTitle?: string;
  pending?: boolean;
  onSubmit: (title: string) => Promise<void> | void;
};

/** Shared form for creating an album and renaming an existing one. */
export function AlbumTitleDialog({
  open,
  onOpenChange,
  mode,
  initialTitle = "",
  pending = false,
  onSubmit,
}: AlbumTitleDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: initialTitle },
  });

  useEffect(() => {
    if (open) form.reset({ title: initialTitle });
  }, [open, initialTitle, form]);

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "New album" : "Rename album"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Group photos by trip, event or theme."
              : "Choose a new title for this album."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values.title);
          })}
        >
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor="album-title">Title</FieldLabel>
            <Input
              id="album-title"
              placeholder="Summer in Lisbon"
              autoFocus
              aria-invalid={!!form.formState.errors.title}
              {...form.register("title")}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner className="size-4" />}
              {isCreate ? "Create album" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
