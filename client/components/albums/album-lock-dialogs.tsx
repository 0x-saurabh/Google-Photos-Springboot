"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useChangeAlbumPin, useLockAlbum, useRemoveAlbumLock } from "@/hooks/use-albums";
import { isValidPin, PinInput } from "@/components/albums/pin-input";

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId: string;
  albumTitle: string;
};

const errorText = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

/** First-time lock: choose a PIN and confirm it. */
export function SetPinDialog({ open, onOpenChange, albumId, albumTitle }: BaseProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every field and mutation starts clean each time. */}
        <SetPinForm onOpenChange={onOpenChange} albumId={albumId} albumTitle={albumTitle} />
      </DialogContent>
    </Dialog>
  );
}

function SetPinForm({ onOpenChange, albumId, albumTitle }: Omit<BaseProps, "open">) {
  const lockAlbum = useLockAlbum(albumId);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const pinId = useId();
  const confirmId = useId();


  const mismatch = confirm.length > 0 && confirm.length >= pin.length && confirm !== pin;
  const canSubmit = isValidPin(pin) && confirm === pin && !lockAlbum.isPending;
  const error = localError ?? (lockAlbum.error ? errorText(lockAlbum.error) : null);

  return (
    <>
    <DialogHeader>
      <DialogTitle>Lock “{albumTitle}” with a PIN</DialogTitle>
      <DialogDescription>
        Photos in a locked album leave the library, search and dashboard until the PIN is entered.
        Anyone with your account password can remove the lock, so a forgotten PIN is recoverable.
      </DialogDescription>
    </DialogHeader>

    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValidPin(pin)) return setLocalError("Use 4 to 6 digits.");
        if (confirm !== pin) return setLocalError("The PINs don't match.");
        setLocalError(null);
        lockAlbum.mutate(pin, { onSuccess: () => onOpenChange(false) });
      }}
    >
      <Field>
        <FieldLabel htmlFor={pinId}>New PIN</FieldLabel>
        <PinInput id={pinId} value={pin} onChange={setPin} autoFocus disabled={lockAlbum.isPending} />
        <FieldDescription className="text-center">4 to 6 digits</FieldDescription>
      </Field>
      <Field data-invalid={mismatch || undefined}>
        <FieldLabel htmlFor={confirmId}>Confirm PIN</FieldLabel>
        <PinInput id={confirmId} value={confirm} onChange={setConfirm} invalid={mismatch} disabled={lockAlbum.isPending} />
        {mismatch && <FieldError className="text-center">The PINs don&apos;t match.</FieldError>}
      </Field>
      {error && <p className="text-center text-sm text-destructive" role="alert">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={lockAlbum.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {lockAlbum.isPending && <Spinner className="size-4" />}
          Lock album
        </Button>
      </DialogFooter>
    </form>
    </>
  );
}

export function ChangePinDialog({ open, onOpenChange, albumId, albumTitle }: BaseProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every field and mutation starts clean each time. */}
        <ChangePinForm onOpenChange={onOpenChange} albumId={albumId} albumTitle={albumTitle} />
      </DialogContent>
    </Dialog>
  );
}

function ChangePinForm({ onOpenChange, albumId, albumTitle }: Omit<BaseProps, "open">) {
  const changePin = useChangeAlbumPin(albumId);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();


  const mismatch = confirm.length >= newPin.length && confirm.length > 0 && confirm !== newPin;
  const canSubmit = isValidPin(currentPin) && isValidPin(newPin) && confirm === newPin && !changePin.isPending;

  return (
    <>
    <DialogHeader>
      <DialogTitle>Change the PIN for “{albumTitle}”</DialogTitle>
      <DialogDescription>Enter the current PIN, then choose a new one.</DialogDescription>
    </DialogHeader>
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        changePin.mutate({ currentPin, newPin }, { onSuccess: () => onOpenChange(false) });
      }}
    >
      <Field>
        <FieldLabel htmlFor={currentId}>Current PIN</FieldLabel>
        <PinInput id={currentId} value={currentPin} onChange={setCurrentPin} autoFocus disabled={changePin.isPending} />
      </Field>
      <Field>
        <FieldLabel htmlFor={newId}>New PIN</FieldLabel>
        <PinInput id={newId} value={newPin} onChange={setNewPin} disabled={changePin.isPending} />
      </Field>
      <Field data-invalid={mismatch || undefined}>
        <FieldLabel htmlFor={confirmId}>Confirm new PIN</FieldLabel>
        <PinInput id={confirmId} value={confirm} onChange={setConfirm} invalid={mismatch} disabled={changePin.isPending} />
        {mismatch && <FieldError className="text-center">The PINs don&apos;t match.</FieldError>}
      </Field>
      {changePin.error && (
        <p className="text-center text-sm text-destructive" role="alert">{errorText(changePin.error)}</p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={changePin.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {changePin.isPending && <Spinner className="size-4" />}
          Change PIN
        </Button>
      </DialogFooter>
    </form>
    </>
  );
}

/** Removing the lock takes the PIN, or the account password when the PIN is forgotten. */
export function RemoveLockDialog({ open, onOpenChange, albumId, albumTitle }: BaseProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every field and mutation starts clean each time. */}
        <RemoveLockForm onOpenChange={onOpenChange} albumId={albumId} albumTitle={albumTitle} />
      </DialogContent>
    </Dialog>
  );
}

function RemoveLockForm({ onOpenChange, albumId, albumTitle }: Omit<BaseProps, "open">) {
  const removeLock = useRemoveAlbumLock(albumId);
  const [usePassword, setUsePassword] = useState(false);
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const pinId = useId();
  const passwordId = useId();


  const canSubmit = (usePassword ? password.length > 0 : isValidPin(pin)) && !removeLock.isPending;

  return (
    <>
    <DialogHeader>
      <DialogTitle>Remove the lock from “{albumTitle}”?</DialogTitle>
      <DialogDescription>
        Its photos will show in your library again and the album opens without a PIN.
      </DialogDescription>
    </DialogHeader>
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        removeLock.mutate(usePassword ? { password } : { pin }, { onSuccess: () => onOpenChange(false) });
      }}
    >
      {usePassword ? (
        <Field>
          <FieldLabel htmlFor={passwordId}>Account password</FieldLabel>
          <Input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={removeLock.isPending}
          />
          <FieldDescription>Used because the PIN was forgotten. Nothing else changes.</FieldDescription>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor={pinId}>Album PIN</FieldLabel>
          <PinInput id={pinId} value={pin} onChange={setPin} autoFocus disabled={removeLock.isPending} />
        </Field>
      )}
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => {
          setUsePassword((value) => !value);
          removeLock.reset();
        }}
      >
        {usePassword ? "I remember the PIN" : "Forgot the PIN? Use your account password"}
      </button>
      {removeLock.error && (
        <p className="text-center text-sm text-destructive" role="alert">{errorText(removeLock.error)}</p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={removeLock.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!canSubmit}>
          {removeLock.isPending && <Spinner className="size-4" />}
          Remove lock
        </Button>
      </DialogFooter>
    </form>
    </>
  );
}
