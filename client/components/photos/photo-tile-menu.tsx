"use client";

import {
  Archive,
  ExternalLink,
  FolderMinus,
  FolderPlus,
  Maximize2,
  MoreHorizontal,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { photoHref, type PhotoContext } from "@/components/photos/photo-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Photo } from "@/lib/api";

/** Actions the grid owns (dialogs and mutations) and passes down to each tile. */
export type PhotoTileMenuHandlers = {
  onAddToAlbum: (photo: Photo) => void;
  onArchive: (photo: Photo) => void;
  onTrash: (photo: Photo) => void;
  onRestore: (photo: Photo) => void;
  onDeleteForever: (photo: Photo) => void;
  onSetCover: (photo: Photo) => void;
  onRemoveFromAlbum: (photo: Photo) => void;
};

type PhotoTileMenuProps = {
  photo: Photo;
  context: PhotoContext;
  handlers: PhotoTileMenuHandlers;
};

export function PhotoTileMenu({ photo, context, handlers }: PhotoTileMenuProps) {
  const router = useRouter();
  const status = context.kind === "library" ? context.status : "ACTIVE";
  const isCover = context.kind === "album" && context.coverPhotoId === photo.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Actions for ${photo.fileName}`}
            className="size-7 rounded-full border border-white/60 bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white dark:hover:bg-black/55"
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        <DropdownMenuItem onClick={() => router.push(photoHref(photo.id, context))}>
          <Maximize2 />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(photo.url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink />
          Open original
        </DropdownMenuItem>

        {status === "ACTIVE" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlers.onAddToAlbum(photo)}>
              <FolderPlus />
              Add to album
            </DropdownMenuItem>
            {context.kind === "album" && (
              <>
                <DropdownMenuItem disabled={isCover} onClick={() => handlers.onSetCover(photo)}>
                  <Star />
                  {isCover ? "Current cover" : "Set as album cover"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlers.onRemoveFromAlbum(photo)}>
                  <FolderMinus />
                  Remove from album
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlers.onArchive(photo)}>
              <Archive />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => handlers.onTrash(photo)}>
              <Trash2 />
              Move to trash
            </DropdownMenuItem>
          </>
        )}

        {status === "ARCHIVE" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlers.onRestore(photo)}>
              <RotateCcw />
              Restore to library
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => handlers.onTrash(photo)}>
              <Trash2 />
              Move to trash
            </DropdownMenuItem>
          </>
        )}

        {status === "TRASH" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlers.onRestore(photo)}>
              <RotateCcw />
              Restore
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => handlers.onDeleteForever(photo)}>
              <Trash2 />
              Delete forever
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
