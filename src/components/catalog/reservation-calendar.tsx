"use client";

import { isBefore, isWithinInterval, parseISO, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { ReservationRead } from "@/types/listing";

interface ReservationCalendarProps {
  reservations: ReservationRead[];
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
}

export function ReservationCalendar({
  reservations,
  selected,
  onSelect,
}: ReservationCalendarProps) {
  const today = startOfDay(new Date());

  function isReservedDate(date: Date): boolean {
    return reservations.some((r) => {
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      return isWithinInterval(date, { start, end });
    });
  }

  function isDisabled(date: Date): boolean {
    return isBefore(date, today) || isReservedDate(date);
  }

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onSelect}
      disabled={isDisabled}
      modifiers={{ reserved: isReservedDate }}
      modifiersClassNames={{
        reserved: cn("bg-muted text-muted-foreground"),
      }}
    />
  );
}
