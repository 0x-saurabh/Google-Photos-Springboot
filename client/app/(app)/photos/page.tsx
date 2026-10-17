import type { Metadata } from "next";
import { PhotoLibraryView } from "@/components/photos/photo-library-view";

export const metadata: Metadata = { title: "Photos" };

export default function PhotosPage() {
  return (
    <PhotoLibraryView
      title="Photos"
      description="Everything in your library, newest first"
      status="ACTIVE"
      emptyTitle="Your library is empty"
      emptyDescription="Drop images anywhere on this page or use the upload button. They are stored in ImageKit and appear here right away."
      showUpload
    />
  );
}
