import type { Metadata } from "next";
import { PhotoLibraryView } from "@/components/photos/photo-library-view";

export const metadata: Metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <PhotoLibraryView
      title="Archive"
      description="Hidden from the main library, kept in full"
      status="ARCHIVE"
      emptyTitle="Nothing archived"
      emptyDescription="Archive photos you want to keep but not see every day. You can restore them at any time."
      emptyIcon="archive"
    />
  );
}
