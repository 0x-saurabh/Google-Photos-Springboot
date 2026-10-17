"use client";

import { useRef } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnqueueUploads } from "@/hooks/use-upload-queue";
import { ACCEPTED_IMAGE_EXTENSIONS } from "@/lib/photo-upload";

type PhotoUploadButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> & {
  label?: string;
};

/** Opens the system file picker and queues the chosen images for upload. */
export function PhotoUploadButton({ label = "Upload", ...props }: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const enqueue = useEnqueueUploads();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={`image/*,${ACCEPTED_IMAGE_EXTENSIONS}`}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          enqueue(event.target.files);
          event.target.value = "";
        }}
      />
      <Button onClick={() => inputRef.current?.click()} {...props}>
        <ImageUp data-icon="inline-start" />
        {label}
      </Button>
    </>
  );
}
