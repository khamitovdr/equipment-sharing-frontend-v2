"use client";

import { useFieldArray, Controller, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SpecsEditorProps {
  control: Control<any>;
}

export function SpecsEditor({ control }: SpecsEditorProps) {
  const t = useTranslations("listingForm.specs");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications_list",
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("title")}</p>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Controller
            name={`specifications_list.${index}.key`}
            control={control}
            render={({ field }) => (
              <Input
                placeholder={t("key")}
                className="flex-1"
                {...field}
              />
            )}
          />
          <Controller
            name={`specifications_list.${index}.value`}
            control={control}
            render={({ field }) => (
              <Input
                placeholder={t("value")}
                className="flex-1"
                {...field}
              />
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            aria-label="Remove specification"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ key: "", value: "" })}
        className="w-full"
      >
        <Plus className="size-4" />
        {t("add")}
      </Button>
    </div>
  );
}
