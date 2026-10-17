"use client";

import { useId, useState } from "react";
import { Lock } from "lucide-react";
import { isValidPin, PinInput } from "@/components/albums/pin-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUnlockAlbum } from "@/hooks/use-albums";

type AlbumLockScreenProps = {
  albumId: string;
  photoCount: number;
  onUnlocked?: () => void;
};

/** Replaces the photo grid of a locked album until the right PIN is entered. */
export function AlbumLockScreen({ albumId, photoCount, onUnlocked }: AlbumLockScreenProps) {
  const unlock = useUnlockAlbum(albumId);
  const [pin, setPin] = useState("");
  const inputId = useId();
  const errorId = useId();

  const submit = (value: string) => {
    if (!isValidPin(value) || unlock.isPending) return;
    unlock.mutate(value, {
      onSuccess: () => onUnlocked?.(),
      onError: () => setPin(""),
    });
  };

  return (
    <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-12">
      <form
        className="flex w-full max-w-sm flex-col items-center gap-5 text-center"
        onSubmit={(event) => {
          event.preventDefault();
          submit(pin);
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">This album is locked</h2>
          <p className="text-sm text-muted-foreground">
            Enter the PIN to see {photoCount === 1 ? "its photo" : `its ${photoCount} photos`}. It stays unlocked
            for ten minutes on this tab.
          </p>
        </div>
        <label htmlFor={inputId} className="sr-only">
          Album PIN
        </label>
        <PinInput
          id={inputId}
          value={pin}
          onChange={setPin}
          onComplete={(value) => submit(value)}
          autoFocus
          invalid={!!unlock.error}
          aria-describedby={unlock.error ? errorId : undefined}
        />
        {unlock.error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {unlock.error instanceof Error ? unlock.error.message : "Could not unlock the album"}
          </p>
        )}
        <Button type="submit" disabled={!isValidPin(pin) || unlock.isPending} className="min-w-32">
          {unlock.isPending ? <Spinner className="size-4" /> : null}
          Unlock
        </Button>
      </form>
    </div>
  );
}
