"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { orderOfferSchema, type OrderOfferFormData } from "@/lib/validators/order";
import type { OrderRead } from "@/types/order";

type RenterAction = "accept" | "cancel";
type OrgAction = "offer" | "re-offer" | "approve" | "cancel";

interface OrderActionsBarProps {
  order: OrderRead;
  side: "renter" | "org";
  onAccept?: () => void;
  onCancel?: () => void;
  onOffer?: (data: OrderOfferFormData) => void;
  onApprove?: () => void;
  isPending?: boolean;
}

const RENTER_ACTIONS: Record<string, RenterAction[]> = {
  pending: ["cancel"],
  offered: ["accept", "cancel"],
  accepted: ["cancel"],
  confirmed: ["cancel"],
  active: ["cancel"],
};

const ORG_ACTIONS: Record<string, OrgAction[]> = {
  pending: ["offer", "cancel"],
  offered: ["re-offer", "cancel"],
  accepted: ["approve", "re-offer", "cancel"],
  confirmed: ["cancel"],
  active: ["cancel"],
};

export function OrderActionsBar({
  order,
  side,
  onAccept,
  onCancel,
  onOffer,
  onApprove,
  isPending = false,
}: OrderActionsBarProps) {
  const t = useTranslations();

  const orgActions = side === "org" ? (ORG_ACTIONS[order.status] ?? []) : [];
  const isFirstOffer = orgActions.includes("offer");
  const [showOfferForm, setShowOfferForm] = useState(isFirstOffer);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const actions = side === "renter"
    ? RENTER_ACTIONS[order.status] ?? []
    : ORG_ACTIONS[order.status] ?? [];

  if (actions.length === 0) return null;

  const confirmMessage = side === "renter"
    ? t("orders.cancelConfirm")
    : t("orgOrders.cancelConfirm");

  return (
    <div className="flex flex-col lg:flex-col-reverse gap-3">
      <div className="flex flex-wrap gap-2">
        {side === "renter" && (actions as RenterAction[]).map((action) => {
          if (action === "accept") {
            return (
              <Button key={action} className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white" onClick={onAccept} disabled={isPending}>
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                {t("orders.actions.accept")}
              </Button>
            );
          }
          if (action === "cancel") {
            return (
              <Button
                key={action}
                variant="outline"
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isPending}
              >
                {t("orders.actions.cancel")}
              </Button>
            );
          }
          return null;
        })}

        {side === "org" && (actions as OrgAction[]).map((action) => {
          if (action === "offer" || action === "re-offer") {
            return (
              <Button
                key={action}
                className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
                onClick={() => setShowOfferForm(!showOfferForm)}
                disabled={isPending}
              >
                {t(action === "offer" ? "orgOrders.actions.makeOffer" : "orgOrders.actions.reOffer")}
              </Button>
            );
          }
          if (action === "approve") {
            return (
              <Button key={action} className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white" onClick={onApprove} disabled={isPending}>
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                {t("orgOrders.actions.approve")}
              </Button>
            );
          }
          if (action === "cancel") {
            return (
              <Button
                key={action}
                variant="outline"
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isPending}
              >
                {t("orgOrders.actions.cancel")}
              </Button>
            );
          }
          return null;
        })}
      </div>

      {showOfferForm && side === "org" && (
        <OfferFormInline
          order={order}
          onSubmit={(data) => {
            onOffer?.(data);
            setShowOfferForm(false);
          }}
          onCancel={() => setShowOfferForm(false)}
          isPending={isPending}
        />
      )}

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title={side === "renter" ? t("orders.actions.cancel") : t("orgOrders.actions.cancel")}
        description={confirmMessage}
        onConfirm={() => {
          onCancel?.();
          setShowCancelConfirm(false);
        }}
      />
    </div>
  );
}

function OfferFormInline({
  order,
  onSubmit,
  onCancel,
  isPending,
}: {
  order: OrderRead;
  onSubmit: (data: OrderOfferFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("orgOrders.offerForm");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderOfferFormData>({
    resolver: zodResolver(orderOfferSchema),
    defaultValues: {
      offered_cost: order.offered_cost ?? order.estimated_cost ?? "",
      offered_start_date: order.offered_start_date
        ? order.offered_start_date
        : order.requested_start_date,
      offered_end_date: order.offered_end_date
        ? order.offered_end_date
        : order.requested_end_date,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border bg-muted/50 p-4 space-y-4"
    >
      <p className="text-sm font-medium">{t("title")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="offered_cost">{t("cost")}</Label>
          <Input
            id="offered_cost"
            type="number"
            step="0.01"
            {...register("offered_cost")}
          />
          {errors.offered_cost && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.offered_cost.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offered_start_date">{t("startDate")}</Label>
          <Input
            id="offered_start_date"
            type="date"
            {...register("offered_start_date")}
          />
          {errors.offered_start_date && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.offered_start_date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offered_end_date">{t("endDate")}</Label>
          <Input
            id="offered_end_date"
            type="date"
            {...register("offered_end_date")}
          />
          {errors.offered_end_date && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.offered_end_date.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          {t("submit")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
