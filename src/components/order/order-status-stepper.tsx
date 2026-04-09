"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const FLOW_STEPS: OrderStatus[] = [
  "pending",
  "offered",
  "accepted",
  "confirmed",
  "active",
  "finished",
];

const TERMINAL_STATUSES: OrderStatus[] = [
  "canceled_by_user",
  "canceled_by_organization",
  "expired",
];

interface OrderStatusStepperProps {
  status: OrderStatus;
}

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const t = useTranslations("orders.status");
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const currentIndex = FLOW_STEPS.indexOf(status);

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-start">
        {FLOW_STEPS.map((step, i) => {
          const isCompleted = !isTerminal && currentIndex > i;
          const isCurrent = !isTerminal && currentIndex === i;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                    (isCompleted || isCurrent) && !isTerminal && "border-foreground bg-foreground text-background",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground",
                    isTerminal && "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px] whitespace-nowrap",
                    (isCompleted || isCurrent) && !isTerminal
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {t(step)}
                </span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mt-3.5",
                    !isTerminal && currentIndex > i ? "bg-foreground" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
        {isTerminal && (
          <>
            <div className="h-0.5 flex-1 mx-2 mt-3.5 bg-red-300 dark:bg-red-800" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-600 dark:text-red-400">
                ✕
              </div>
              <span className="text-[11px] whitespace-nowrap font-medium text-red-600 dark:text-red-400">
                {t(status)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Mobile — compact */}
      <div className="sm:hidden flex items-center gap-3 justify-end">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
            isTerminal
              ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-foreground bg-foreground text-background"
          )}
        >
          {isTerminal ? "✕" : currentIndex + 1}
        </div>
        <div className="flex flex-col">
          <span className={cn("text-sm font-medium", isTerminal ? "text-red-600 dark:text-red-400" : "text-foreground")}>
            {t(status)}
          </span>
          {!isTerminal && (
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {FLOW_STEPS.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
