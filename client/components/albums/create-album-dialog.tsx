"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlbumTitleDialog } from "@/components/albums/album-title-dialog";
import { Button } from "@/components/ui/button";
import { useCreateAlbum } from "@/hooks/use-albums";

type CreateAlbumDialogProps = {
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  /** Navigate into the new album after creating it. */
  openAfterCreate?: boolean;
};

export function CreateAlbumDialog({
  size = "sm",
  variant = "default",
  openAfterCreate = true,
}: CreateAlbumDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const createMutation = useCreateAlbum();

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Plus />
        New album
      </Button>

      <AlbumTitleDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        pending={createMutation.isPending}
        onSubmit={async (title) => {
          const album = await createMutation.mutateAsync(title);
          setOpen(false);
          if (openAfterCreate) router.push(`/albums/${album.id}`);
        }}
      />
    </>
  );
}
