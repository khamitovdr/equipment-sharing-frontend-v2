# Slice B: User Profile & Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user settings page where authenticated users edit their profile and change their password.

**Architecture:** Single page at `/[locale]/(public)/settings` under the existing public layout. Three independent card sections (avatar, profile form, password form) composed in one page component. Two React Query mutations talk to `PATCH /users/me`. A reusable phone input formatter and shared password validator are extracted for use by both settings and registration.

**Tech Stack:** Next.js 16, react-hook-form + Zod, React Query mutations, Zustand auth store, next-intl, Base UI + Tailwind, Vitest + Testing Library

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/lib/validators/shared.ts` | Shared password strength Zod refinement |
| `src/lib/validators/settings.ts` | Profile + password change Zod schemas |
| `src/lib/utils/phone.ts` | Pure phone formatting/parsing functions |
| `src/components/shared/phone-input.tsx` | Controlled phone input with auto-formatting |
| `src/lib/hooks/use-update-profile.ts` | React Query mutation for `PATCH /users/me` (profile fields) |
| `src/lib/hooks/use-change-password.ts` | React Query mutation for `PATCH /users/me` (password) |
| `src/components/settings/avatar-section.tsx` | Avatar display + upload wiring |
| `src/components/settings/profile-form.tsx` | Profile edit form (name, email, phone) |
| `src/components/settings/password-form.tsx` | Password change form |
| `src/app/[locale]/(public)/settings/page.tsx` | Page composing the three sections |
| `src/lib/i18n/messages/en.json` | English translations (modify) |
| `src/lib/i18n/messages/ru.json` | Russian translations (modify) |
| `src/lib/validators/auth.ts` | Update register schema to use shared password validator (modify) |

**Test files:**

| File | Tests |
|------|-------|
| `src/lib/utils/__tests__/phone.test.ts` | Phone formatting pure functions |
| `src/lib/validators/__tests__/shared.test.ts` | Password strength validation |
| `src/lib/validators/__tests__/settings.test.ts` | Profile + password form schemas |
| `src/components/shared/__tests__/phone-input.test.tsx` | PhoneInput component behavior |

---

### Task 1: Shared Password Validator

**Files:**
- Create: `src/lib/validators/__tests__/shared.test.ts`
- Create: `src/lib/validators/shared.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/validators/__tests__/shared.test.ts
import { describe, it, expect } from "vitest";
import { passwordSchema } from "../shared";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Aa1xxxx");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a lowercase letter", () => {
    const result = passwordSchema.safeParse("AAAAAAAA1");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without an uppercase letter", () => {
    const result = passwordSchema.safeParse("aaaaaaaa1");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a digit", () => {
    const result = passwordSchema.safeParse("Aaaaaaaaa");
    expect(result.success).toBe(false);
  });

  it("accepts valid password with Latin letters", () => {
    const result = passwordSchema.safeParse("Password1");
    expect(result.success).toBe(true);
  });

  it("accepts valid password with Cyrillic letters", () => {
    const result = passwordSchema.safeParse("Парольчик1");
    expect(result.success).toBe(true);
  });

  it("accepts mixed Latin and Cyrillic", () => {
    const result = passwordSchema.safeParse("Паrolь1xx");
    expect(result.success).toBe(true);
  });

  it("recognises Cyrillic ё as lowercase", () => {
    const result = passwordSchema.safeParse("ПАРОЛЬё1");
    expect(result.success).toBe(true);
  });

  it("recognises Cyrillic Ё as uppercase", () => {
    const result = passwordSchema.safeParse("парольЁ1x");
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validators/__tests__/shared.test.ts`
Expected: FAIL — `Cannot find module '../shared'`

- [ ] **Step 3: Implement the shared password validator**

```ts
// src/lib/validators/shared.ts
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "passwordMinLength")
  .refine((val) => /[a-zа-яё]/.test(val), "passwordLowercase")
  .refine((val) => /[A-ZА-ЯЁ]/.test(val), "passwordUppercase")
  .refine((val) => /\d/.test(val), "passwordDigit");
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validators/__tests__/shared.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/shared.ts src/lib/validators/__tests__/shared.test.ts
git commit -m "feat(settings): add shared password strength validator with tests"
```

---

### Task 2: Phone Formatting Utils

**Files:**
- Create: `src/lib/utils/__tests__/phone.test.ts`
- Create: `src/lib/utils/phone.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/utils/__tests__/phone.test.ts
import { describe, it, expect } from "vitest";
import { formatPhone, extractDigits } from "../phone";

describe("extractDigits", () => {
  it("strips non-digit characters", () => {
    expect(extractDigits("+7 (999) 123-45-67")).toBe("79991234567");
  });

  it("returns empty string for empty input", () => {
    expect(extractDigits("")).toBe("");
  });
});

describe("formatPhone", () => {
  it("formats 8 as +7", () => {
    expect(formatPhone("8")).toBe("+7");
  });

  it("formats 9 as +7 (9", () => {
    expect(formatPhone("9")).toBe("+7 (9");
  });

  it("formats +7 as +7", () => {
    expect(formatPhone("+7")).toBe("+7");
  });

  it("formats 89991234567 as +7 (999) 123-45-67", () => {
    expect(formatPhone("89991234567")).toBe("+7 (999) 123-45-67");
  });

  it("formats raw digits 9991234567 as +7 (999) 123-45-67", () => {
    expect(formatPhone("9991234567")).toBe("+7 (999) 123-45-67");
  });

  it("formats partial input +7999 as +7 (999", () => {
    expect(formatPhone("+7999")).toBe("+7 (999");
  });

  it("formats partial input +79991 as +7 (999) 1", () => {
    expect(formatPhone("+79991")).toBe("+7 (999) 1");
  });

  it("formats partial input +7999123 as +7 (999) 123", () => {
    expect(formatPhone("+7999123")).toBe("+7 (999) 123");
  });

  it("formats partial input +79991234 as +7 (999) 123-4", () => {
    expect(formatPhone("+79991234")).toBe("+7 (999) 123-4");
  });

  it("formats partial input +799912345 as +7 (999) 123-45", () => {
    expect(formatPhone("+799912345")).toBe("+7 (999) 123-45");
  });

  it("formats partial input +7999123456 as +7 (999) 123-45-6", () => {
    expect(formatPhone("+7999123456")).toBe("+7 (999) 123-45-6");
  });

  it("truncates digits beyond 11 total", () => {
    expect(formatPhone("+799912345678")).toBe("+7 (999) 123-45-67");
  });

  it("handles already formatted input", () => {
    expect(formatPhone("+7 (999) 123-45-67")).toBe("+7 (999) 123-45-67");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("handles 79991234567", () => {
    expect(formatPhone("79991234567")).toBe("+7 (999) 123-45-67");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/utils/__tests__/phone.test.ts`
Expected: FAIL — `Cannot find module '../phone'`

- [ ] **Step 3: Implement the phone utils**

```ts
// src/lib/utils/phone.ts

/** Strip everything except digits from a string. */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Format a phone string into +7 (XXX) XXX-XX-XX.
 *
 * Handles common Russian entry patterns:
 * - "8..." → treated as "+7..."
 * - "9..." → treated as "+79..."
 * - "+7..." / "7..." → used directly
 */
export function formatPhone(raw: string): string {
  if (!raw) return "";

  let digits = extractDigits(raw);

  // Normalise leading digit
  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.length > 0 && digits[0] === "9") {
    digits = "7" + digits;
  }

  // Cap at 11 digits (7 + 10)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";

  // Build formatted string progressively
  let result = "+7";
  const rest = digits.slice(1); // digits after "7"

  if (rest.length === 0) return result;

  result += " (";
  result += rest.slice(0, 3);

  if (rest.length <= 3) return result;

  result += ") ";
  result += rest.slice(3, 6);

  if (rest.length <= 6) return result;

  result += "-";
  result += rest.slice(6, 8);

  if (rest.length <= 8) return result;

  result += "-";
  result += rest.slice(8, 10);

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/utils/__tests__/phone.test.ts`
Expected: All 16 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/phone.ts src/lib/utils/__tests__/phone.test.ts
git commit -m "feat(settings): add phone formatting utils with tests"
```

---

### Task 3: PhoneInput Component

**Files:**
- Create: `src/components/shared/__tests__/phone-input.test.tsx`
- Create: `src/components/shared/phone-input.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/shared/__tests__/phone-input.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneInput } from "../phone-input";

describe("PhoneInput", () => {
  it("renders with a formatted value", () => {
    render(<PhoneInput value="+7 (999) 123-45-67" onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("+7 (999) 123-45-67");
  });

  it("formats on change and calls onChange with formatted value", async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "9");
    expect(onChange).toHaveBeenCalledWith("+7 (9");
  });

  it("passes aria-invalid to the input", () => {
    render(
      <PhoneInput value="" onChange={() => {}} aria-invalid={true} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/shared/__tests__/phone-input.test.tsx`
Expected: FAIL — `Cannot find module '../phone-input'`

- [ ] **Step 3: Implement the PhoneInput component**

```tsx
// src/components/shared/phone-input.tsx
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
        // Place cursor at end when formatting adds characters
        const newDigits = extractDigits(raw).length;
        const formattedDigits = extractDigits(formatted).length;
        if (newDigits === formattedDigits) {
          // Find cursor position by mapping digit count before cursor
          const rawPos = e.target.selectionStart ?? raw.length;
          const digitsBefore = extractDigits(raw.slice(0, rawPos)).length;
          // Walk formatted string to find position after that many digits
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/shared/__tests__/phone-input.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/phone-input.tsx src/components/shared/__tests__/phone-input.test.tsx
git commit -m "feat(settings): add PhoneInput component with auto-formatting"
```

---

### Task 4: Settings Validators

**Files:**
- Create: `src/lib/validators/__tests__/settings.test.ts`
- Create: `src/lib/validators/settings.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/validators/__tests__/settings.test.ts
import { describe, it, expect } from "vitest";
import { profileSchema, passwordChangeSchema } from "../settings";

describe("profileSchema", () => {
  const valid = {
    name: "Dmitry",
    surname: "Khamitov",
    middle_name: "",
    email: "dmitry@example.com",
    phone: "+7 (999) 123-45-67",
  };

  it("accepts valid profile data", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(profileSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects empty surname", () => {
    expect(profileSchema.safeParse({ ...valid, surname: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(profileSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });

  it("rejects incorrectly formatted phone", () => {
    expect(profileSchema.safeParse({ ...valid, phone: "89991234567" }).success).toBe(false);
  });

  it("allows empty middle_name", () => {
    expect(profileSchema.safeParse({ ...valid, middle_name: "" }).success).toBe(true);
  });
});

describe("passwordChangeSchema", () => {
  const valid = {
    password: "oldPassword",
    new_password: "NewPass1",
    confirm_password: "NewPass1",
  };

  it("accepts valid password change", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty current password", () => {
    expect(
      passwordChangeSchema.safeParse({ ...valid, password: "" }).success
    ).toBe(false);
  });

  it("rejects weak new password", () => {
    expect(
      passwordChangeSchema.safeParse({ ...valid, new_password: "weak", confirm_password: "weak" }).success
    ).toBe(false);
  });

  it("rejects mismatched confirm password", () => {
    expect(
      passwordChangeSchema.safeParse({ ...valid, confirm_password: "Different1" }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validators/__tests__/settings.test.ts`
Expected: FAIL — `Cannot find module '../settings'`

- [ ] **Step 3: Implement the settings validators**

```ts
// src/lib/validators/settings.ts
import { z } from "zod";
import { passwordSchema } from "./shared";

export const profileSchema = z.object({
  name: z.string().min(1, "nameRequired"),
  surname: z.string().min(1, "surnameRequired"),
  middle_name: z.string().optional().default(""),
  email: z.string().email("emailInvalid"),
  phone: z.string().regex(
    /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
    "phoneInvalid"
  ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    password: z.string().min(1, "currentPasswordRequired"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "confirmPasswordRequired"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "passwordMismatch",
    path: ["confirm_password"],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validators/__tests__/settings.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/settings.ts src/lib/validators/__tests__/settings.test.ts
git commit -m "feat(settings): add profile and password change Zod schemas"
```

---

### Task 5: i18n Keys

**Files:**
- Modify: `src/lib/i18n/messages/en.json`
- Modify: `src/lib/i18n/messages/ru.json`

- [ ] **Step 1: Add English translation keys**

Add the `"settings"` key to `en.json`, after the `"auth"` block:

```json
"settings": {
  "title": "Settings",
  "profile": "Profile",
  "avatar": {
    "change": "Change photo"
  },
  "name": "First name",
  "surname": "Last name",
  "middleName": "Middle name",
  "email": "Email",
  "phone": "Phone",
  "save": "Save",
  "password": {
    "title": "Change Password",
    "current": "Current password",
    "new": "New password",
    "confirm": "Confirm new password",
    "update": "Update Password"
  },
  "success": {
    "profile": "Profile updated",
    "password": "Password changed"
  },
  "validation": {
    "nameRequired": "First name is required",
    "surnameRequired": "Last name is required",
    "emailInvalid": "Invalid email address",
    "emailTaken": "Email already taken",
    "phoneInvalid": "Phone must be in format +7 (XXX) XXX-XX-XX",
    "currentPasswordRequired": "Current password is required",
    "confirmPasswordRequired": "Confirm your new password",
    "passwordMinLength": "At least 8 characters",
    "passwordLowercase": "At least one lowercase letter (a-z or а-яё)",
    "passwordUppercase": "At least one uppercase letter (A-Z or А-ЯЁ)",
    "passwordDigit": "At least one digit",
    "passwordMismatch": "Passwords do not match",
    "wrongPassword": "Current password is incorrect"
  }
}
```

- [ ] **Step 2: Add Russian translation keys**

Add the `"settings"` key to `ru.json`, after the `"auth"` block:

```json
"settings": {
  "title": "Настройки",
  "profile": "Профиль",
  "avatar": {
    "change": "Изменить фото"
  },
  "name": "Имя",
  "surname": "Фамилия",
  "middleName": "Отчество",
  "email": "Email",
  "phone": "Телефон",
  "save": "Сохранить",
  "password": {
    "title": "Изменить пароль",
    "current": "Текущий пароль",
    "new": "Новый пароль",
    "confirm": "Подтвердите новый пароль",
    "update": "Обновить пароль"
  },
  "success": {
    "profile": "Профиль обновлён",
    "password": "Пароль изменён"
  },
  "validation": {
    "nameRequired": "Имя обязательно",
    "surnameRequired": "Фамилия обязательна",
    "emailInvalid": "Неверный email",
    "emailTaken": "Email уже занят",
    "phoneInvalid": "Телефон в формате +7 (XXX) XXX-XX-XX",
    "currentPasswordRequired": "Введите текущий пароль",
    "confirmPasswordRequired": "Подтвердите новый пароль",
    "passwordMinLength": "Минимум 8 символов",
    "passwordLowercase": "Минимум одна строчная буква (a-z или а-яё)",
    "passwordUppercase": "Минимум одна заглавная буква (A-Z или А-ЯЁ)",
    "passwordDigit": "Минимум одна цифра",
    "passwordMismatch": "Пароли не совпадают",
    "wrongPassword": "Неверный текущий пароль"
  }
}
```

- [ ] **Step 3: Verify the app still compiles**

Run: `npx next build --no-lint` (or `npx tsc --noEmit` if faster)
Expected: No errors from JSON changes

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/messages/en.json src/lib/i18n/messages/ru.json
git commit -m "feat(settings): add i18n keys for settings page (en + ru)"
```

---

### Task 6: Mutation Hooks

**Files:**
- Create: `src/lib/hooks/use-update-profile.ts`
- Create: `src/lib/hooks/use-change-password.ts`

- [ ] **Step 1: Create the profile update mutation hook**

```ts
// src/lib/hooks/use-update-profile.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserUpdate } from "@/types/user";

export function useUpdateProfile() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: UserUpdate) => {
      if (!token) throw new Error("Not authenticated");
      return usersApi.update(token, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });
}
```

- [ ] **Step 2: Create the password change mutation hook**

```ts
// src/lib/hooks/use-change-password.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useChangePassword() {
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: (data: { password: string; new_password: string }) => {
      if (!token) throw new Error("Not authenticated");
      return usersApi.update(token, data);
    },
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/hooks/use-update-profile.ts src/lib/hooks/use-change-password.ts
git commit -m "feat(settings): add useUpdateProfile and useChangePassword mutation hooks"
```

---

### Task 7: Avatar Section Component

**Files:**
- Create: `src/components/settings/avatar-section.tsx`

- [ ] **Step 1: Implement the avatar section**

This component wraps the existing `AvatarUpload` in immediate mode — it manages the full upload-then-patch flow.

```tsx
// src/components/settings/avatar-section.tsx
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mediaApi } from "@/lib/api/media";
import { usersApi } from "@/lib/api/users";
import { AvatarUpload } from "@/components/media/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export function AvatarSection() {
  const t = useTranslations();
  const { user, token } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!token) return;

      try {
        setUploadState("uploading");
        setUploadProgress(0);

        // 1. Get presigned URL
        const { media_id, upload_url } = await mediaApi.requestUploadUrl(
          token,
          {
            kind: "photo",
            context: "user_profile",
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
          }
        );

        // 2. Upload via XHR for progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable)
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener("load", () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error("Upload failed"))
          );
          xhr.addEventListener("error", () =>
            reject(new Error("Network error"))
          );
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // 3. Confirm
        await mediaApi.confirm(token, media_id);
        setUploadState("processing");

        // 4. Poll until ready
        while (true) {
          const status = await mediaApi.status(token, media_id);
          if (status.status === "ready") {
            // 5. Patch profile with new photo
            const updatedUser = await usersApi.update(token, {
              profile_photo_id: media_id,
            });
            setUser(updatedUser);
            setUploadState("ready");
            toast.success(t("settings.success.profile"));
            return;
          }
          if (status.status === "failed") {
            setUploadState("failed");
            toast.error(t("common.error"));
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        setUploadState("failed");
        toast.error(t("common.error"));
      }
    },
    [token, setUser, t]
  );

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <AvatarUpload
          onFileSelected={handleFileSelected}
          currentUrl={user?.profile_photo?.medium_url}
          uploadState={uploadState}
          uploadProgress={uploadProgress}
        />
        <div>
          <p className="font-medium">
            {user?.name} {user?.surname}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("settings.avatar.change")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/avatar-section.tsx
git commit -m "feat(settings): add AvatarSection component with upload flow"
```

---

### Task 8: Profile Form Component

**Files:**
- Create: `src/components/settings/profile-form.tsx`

- [ ] **Step 1: Implement the profile form**

```tsx
// src/components/settings/profile-form.tsx
"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUpdateProfile } from "@/lib/hooks/use-update-profile";
import { ApiRequestError } from "@/lib/api/client";
import {
  profileSchema,
  type ProfileFormData,
} from "@/lib/validators/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/shared/phone-input";

export function ProfileForm() {
  const t = useTranslations();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      middle_name: user?.middle_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  // Sync form when user data changes (e.g., after avatar upload updates the store)
  useEffect(() => {
    if (user) {
      reset(
        {
          name: user.name,
          surname: user.surname,
          middle_name: user.middle_name ?? "",
          email: user.email,
          phone: user.phone,
        },
        { keepDirty: true }
      );
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await updateProfile.mutateAsync({
        name: data.name,
        surname: data.surname,
        middle_name: data.middle_name || null,
        email: data.email,
        phone: data.phone,
      });
      reset({
        name: updatedUser.name,
        surname: updatedUser.surname,
        middle_name: updatedUser.middle_name ?? "",
        email: updatedUser.email,
        phone: updatedUser.phone,
      });
      toast.success(t("settings.success.profile"));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("email", { message: "emailTaken" });
      } else {
        toast.error(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <fieldset className="space-y-4">
            <legend className="sr-only">{t("settings.profile")}</legend>

            {/* Name + Surname */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name">{t("settings.name")}</Label>
                <Input
                  id="settings-name"
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "settings-name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="settings-name-error" className="text-xs text-destructive">
                    {t(`settings.validation.${errors.name.message}`)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-surname">{t("settings.surname")}</Label>
                <Input
                  id="settings-surname"
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={!!errors.surname}
                  aria-describedby={errors.surname ? "settings-surname-error" : undefined}
                  {...register("surname")}
                />
                {errors.surname && (
                  <p id="settings-surname-error" className="text-xs text-destructive">
                    {t(`settings.validation.${errors.surname.message}`)}
                  </p>
                )}
              </div>
            </div>

            {/* Middle name */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-middle-name">{t("settings.middleName")}</Label>
              <Input
                id="settings-middle-name"
                type="text"
                autoComplete="additional-name"
                {...register("middle_name")}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">{t("settings.email")}</Label>
              <Input
                id="settings-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "settings-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="settings-email-error" className="text-xs text-destructive">
                  {t(`settings.validation.${errors.email.message}`)}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-phone">{t("settings.phone")}</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="settings-phone"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "settings-phone-error" : undefined}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.phone && (
                <p id="settings-phone-error" className="text-xs text-destructive">
                  {t(`settings.validation.${errors.phone.message}`)}
                </p>
              )}
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("settings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/profile-form.tsx
git commit -m "feat(settings): add ProfileForm component"
```

---

### Task 9: Password Form Component

**Files:**
- Create: `src/components/settings/password-form.tsx`

- [ ] **Step 1: Implement the password form**

```tsx
// src/components/settings/password-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "@/lib/hooks/use-change-password";
import { ApiRequestError } from "@/lib/api/client";
import {
  passwordChangeSchema,
  type PasswordChangeFormData,
} from "@/lib/validators/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const t = useTranslations();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      await changePassword.mutateAsync({
        password: data.password,
        new_password: data.new_password,
      });
      reset();
      toast.success(t("settings.success.password"));
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        (err.status === 401 || err.status === 403)
      ) {
        setError("password", { message: "wrongPassword" });
      } else {
        toast.error(t("common.error"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.password.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <fieldset className="space-y-4">
            <legend className="sr-only">{t("settings.password.title")}</legend>

            {/* Current password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-current-password">
                {t("settings.password.current")}
              </Label>
              <PasswordInput
                id="settings-current-password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "settings-current-password-error" : undefined
                }
                {...register("password")}
              />
              {errors.password && (
                <p
                  id="settings-current-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.password.message}`)}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-password">
                {t("settings.password.new")}
              </Label>
              <PasswordInput
                id="settings-new-password"
                autoComplete="new-password"
                aria-invalid={!!errors.new_password}
                aria-describedby={
                  errors.new_password ? "settings-new-password-error" : undefined
                }
                {...register("new_password")}
              />
              {errors.new_password && (
                <p
                  id="settings-new-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.new_password.message}`)}
                </p>
              )}
            </div>

            {/* Confirm new password */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-password">
                {t("settings.password.confirm")}
              </Label>
              <PasswordInput
                id="settings-confirm-password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirm_password}
                aria-describedby={
                  errors.confirm_password
                    ? "settings-confirm-password-error"
                    : undefined
                }
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p
                  id="settings-confirm-password-error"
                  className="text-xs text-destructive"
                >
                  {t(`settings.validation.${errors.confirm_password.message}`)}
                </p>
              )}
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("settings.password.update")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/password-form.tsx
git commit -m "feat(settings): add PasswordForm component"
```

---

### Task 10: Settings Page

**Files:**
- Create: `src/app/[locale]/(public)/settings/page.tsx`

- [ ] **Step 1: Implement the settings page**

```tsx
// src/app/[locale]/(public)/settings/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AvatarSection } from "@/components/settings/avatar-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <AvatarSection />
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `npx next build --no-lint`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(public)/settings/page.tsx
git commit -m "feat(settings): add settings page composing avatar, profile, and password sections"
```

---

### Task 11: Update Register Schema to Use Shared Password Validator

**Files:**
- Modify: `src/lib/validators/auth.ts`

- [ ] **Step 1: Update the register schema**

Replace the password field in `registerSchema` to use the shared validator. Change `src/lib/validators/auth.ts` from:

```ts
import { z } from "zod";
```

to:

```ts
import { z } from "zod";
import { passwordSchema } from "./shared";
```

And replace:

```ts
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
```

with:

```ts
  password: passwordSchema,
```

- [ ] **Step 2: Run all existing tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators/auth.ts
git commit -m "refactor(auth): use shared password validator in register schema"
```

---

### Task 12: Manual Smoke Test

No files changed — verification only.

- [ ] **Step 1: Start the dev server**

Run: `npx next dev`

- [ ] **Step 2: Verify unauthenticated redirect**

Open `http://localhost:3000/ru/settings` in the browser.
Expected: Redirected to `/ru/login`

- [ ] **Step 3: Log in and visit settings**

Log in with a test account, then navigate to `/ru/settings`.
Expected: Page loads with avatar section, profile form pre-filled with user data, and empty password form.

- [ ] **Step 4: Test profile editing**

Change a field (e.g., middle name), click Save.
Expected: Toast "Профиль обновлён", form resets dirty state, Save button becomes disabled.

- [ ] **Step 5: Test phone formatting**

Clear the phone field and type `89991234567`.
Expected: Input auto-formats to `+7 (999) 123-45-67` as you type.

- [ ] **Step 6: Test password change**

Fill in current password (correct), new password meeting all rules, and matching confirm.
Expected: Toast "Пароль изменён", all password fields cleared.

- [ ] **Step 7: Test password validation**

Type a weak password (e.g., `abc`) in new password field and submit.
Expected: Error messages for each failing rule displayed below the field.

- [ ] **Step 8: Run all tests one final time**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 9: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(settings): smoke test fixes"
```
