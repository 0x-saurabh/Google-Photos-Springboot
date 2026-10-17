"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export const isValidPin = (value: string) => /^\d{4,6}$/.test(value);

type PinInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

/**
 * Six masked digit cells for a 4–6 digit PIN. Digits render as dots so the
 * PIN never sits on screen, and the field uses numeric input mode on phones.
 */
export function PinInput({
  id,
  value,
  onChange,
  onComplete,
  autoFocus,
  disabled,
  invalid,
  className,
  ...aria
}: PinInputProps) {
  return (
    <InputOTP
      id={id}
      maxLength={PIN_MAX}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      containerClassName={cn("justify-center", className)}
      {...aria}
    >
      <InputOTPGroup>
        {Array.from({ length: PIN_MAX }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            mask
            className="size-11 text-xl sm:size-12"
            aria-invalid={invalid || undefined}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
