"use client";

import { useFieldArray, Controller, type Control, type FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/shared/phone-input";

interface ContactsEditorProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export function ContactsEditor({ control, errors }: ContactsEditorProps) {
  const t = useTranslations("orgCreate.contacts");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const contactErrors = (errors.contacts as FieldErrors<any>[] | undefined)?.[index];

        return (
          <div
            key={field.id}
            className="rounded-lg border border-border p-4 space-y-4"
          >
            {/* Header — remove button only */}
            {fields.length > 1 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={t("remove")}
                >
                  <Trash2 className="size-4" />
                  {t("remove")}
                </Button>
              </div>
            )}

            {/* Display name */}
            <div className="space-y-1.5">
              <Label htmlFor={`contacts-${index}-display-name`}>
                {t("displayName")}
              </Label>
              <Controller
                name={`contacts.${index}.display_name`}
                control={control}
                render={({ field }) => (
                  <Input
                    id={`contacts-${index}-display-name`}
                    type="text"
                    aria-invalid={!!contactErrors?.display_name}
                    aria-describedby={
                      contactErrors?.display_name
                        ? `contacts-${index}-display-name-error`
                        : undefined
                    }
                    {...field}
                  />
                )}
              />
              {contactErrors?.display_name && (
                <p
                  id={`contacts-${index}-display-name-error`}
                  className="text-xs text-destructive"
                >
                  {t(String(contactErrors.display_name.message))}
                </p>
              )}
            </div>

            {/* Phone + Email side by side on desktop */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor={`contacts-${index}-phone`}>{t("phone")}</Label>
                <Controller
                  name={`contacts.${index}.phone`}
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id={`contacts-${index}-phone`}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      aria-invalid={!!contactErrors?.phone}
                      aria-describedby={
                        contactErrors?.phone
                          ? `contacts-${index}-phone-error`
                          : undefined
                      }
                    />
                  )}
                />
                {contactErrors?.phone && (
                  <p
                    id={`contacts-${index}-phone-error`}
                    className="text-xs text-destructive"
                  >
                    {t(String(contactErrors.phone.message))}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor={`contacts-${index}-email`}>{t("email")}</Label>
                <Controller
                  name={`contacts.${index}.email`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      id={`contacts-${index}-email`}
                      type="email"
                      aria-invalid={!!contactErrors?.email}
                      aria-describedby={
                        contactErrors?.email
                          ? `contacts-${index}-email-error`
                          : undefined
                      }
                      {...field}
                    />
                  )}
                />
                {contactErrors?.email && (
                  <p
                    id={`contacts-${index}-email-error`}
                    className="text-xs text-destructive"
                  >
                    {t(String(contactErrors.email.message))}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add contact button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ display_name: "", phone: "", email: "" })}
        className="w-full"
      >
        <Plus className="size-4" />
        {t("add")}
      </Button>
    </div>
  );
}
