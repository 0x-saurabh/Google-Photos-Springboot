import type { Metadata } from "next";
import { PhotoLibraryView } from "@/components/photos/photo-library-view";

export const metadata: Metadata = { title: "Trash" };

export default function TrashPage() {
  return (
    <PhotoLibraryView
      title="Trash"
      description="Photos stay here until you restore or permanently delete them"
      status="TRASH"
      emptyTitle="Trash is empty"
      emptyDescription="Photos you move to trash appear here. Restore them to bring them back, or delete them forever."
      emptyIcon="trash"
    />
  );
}
