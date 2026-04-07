"use client";

import { useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { formatPhone, extractDigits } from "@/lib/utils/phone";

interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string;
  onChange: (formatted: string) => void;
}

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatPhone(raw);

      onChange(formatted);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        const newDigits = extractDigits(raw).length;
        const formattedDigits = extractDigits(formatted).length;
        if (newDigits === formattedDigits) {
          const rawPos = e.target.selectionStart ?? raw.length;
          const digitsBefore = extractDigits(raw.slice(0, rawPos)).length;
          let pos = 0;
          let count = 0;
          for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
              count++;
              if (count === digitsBefore) {
                pos = i + 1;
                break;
              }
            }
          }
          if (count < digitsBefore) pos = formatted.length;
          el.setSelectionRange(pos, pos);
        } else {
          el.setSelectionRange(formatted.length, formatted.length);
        }
      });
    },
    [onChange]
  );

  return (
    <Input
      ref={inputRef}
      type="tel"
      inputMode="tel"
      value={value}
      onChange={handleChange}
      placeholder="+7 (___) ___-__-__"
      {...props}
    />
  );
}
