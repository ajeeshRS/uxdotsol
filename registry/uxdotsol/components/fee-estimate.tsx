"use client";

import { useId } from "react";
import {
  CircleAlert,
  Coins,
  Info,
  Loader2,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { UxSolButton } from "./button";

export type FeeEstimateStatus = "idle" | "loading" | "success" | "error";

export type FeeEstimateAmount = {
  value: string;
  symbol: string;
  fiatValue?: string;
};

export type FeeEstimateLine = {
  id: string;
  label: string;
  amount: FeeEstimateAmount;
  description?: string;
};

export type FeeEstimateData = {
  total: FeeEstimateAmount;
  items: readonly FeeEstimateLine[];
  network?: string;
  source?: string;
  updatedAt?: string | number | Date | null;
};

export type FeeEstimateProps = {
  estimate?: FeeEstimateData | null;
  status?: FeeEstimateStatus;
  error?: Error | string | null;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  refreshLabel?: string;
  disclaimer?: string;
  onRefresh?: () => void;
  className?: string;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

function formatAmount(amount: FeeEstimateAmount) {
  return `${amount.value} ${amount.symbol}`;
}

function formatTimestamp(value: FeeEstimateData["updatedAt"]) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: String(value), dateTime: undefined };
  }
  return {
    label: `${DATE_TIME_FORMATTER.format(date)} UTC`,
    dateTime: date.toISOString(),
  };
}

function errorMessage(error: FeeEstimateProps["error"]) {
  if (!error) return "The fee estimate is unavailable.";
  return error instanceof Error ? error.message : error;
}

function EstimateHeader({
  titleId,
  title,
  description,
  status,
}: {
  titleId: string;
  title: string;
  description: string;
  status: FeeEstimateStatus;
}) {
  return (
    <header className="flex items-start gap-3 border-b border-zinc-100 bg-zinc-50 p-6 dark:border-white/8 dark:bg-white/[0.025]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
        <ReceiptText size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id={titleId}
            className="text-sm font-semibold text-zinc-950 dark:text-zinc-50"
          >
            {title}
          </h2>
          {status === "loading" ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
              <Loader2
                size={11}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Updating
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </header>
  );
}

export function FeeEstimate({
  estimate,
  status,
  error,
  title = "Fee estimate",
  description = "Estimated charges for the current transaction message.",
  emptyTitle = "Fee not calculated yet",
  emptyDescription = "Build the transaction message, then request a fee from your provider.",
  refreshLabel = "Refresh estimate",
  disclaimer = "Fees can change when the transaction message, blockhash, or network conditions change.",
  onRefresh,
  className = "",
}: FeeEstimateProps) {
  const titleId = useId();
  const resolvedStatus =
    status ?? (error ? "error" : estimate ? "success" : "idle");
  const updatedAt = formatTimestamp(estimate?.updatedAt);
  const showEmptyState =
    !estimate &&
    resolvedStatus !== "loading" &&
    resolvedStatus !== "error";
  const showLoadingState = !estimate && resolvedStatus === "loading";
  const showErrorState = !estimate && resolvedStatus === "error";

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={resolvedStatus === "loading"}
      className={`w-full max-w-lg overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
    >
      <EstimateHeader
        titleId={titleId}
        title={title}
        description={description}
        status={resolvedStatus}
      />

      {showEmptyState ? (
        <div className="p-7 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
            <Coins size={19} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {emptyDescription}
          </p>
        </div>
      ) : null}

      {showLoadingState ? (
        <div
          role="status"
          className="flex flex-col items-center p-7 text-center"
        >
          <Loader2
            size={24}
            className="animate-spin text-zinc-950 motion-reduce:animate-none dark:text-zinc-50"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Requesting fee from provider…
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            No fee is shown until the provider responds.
          </p>
        </div>
      ) : null}

      {showErrorState ? (
        <div className="p-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/10">
            <div className="flex gap-2.5">
              <CircleAlert
                size={17}
                className="mt-0.5 shrink-0 text-red-600 dark:text-red-300"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Fee request failed
                </p>
                <p
                  role="alert"
                  className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300"
                >
                  {errorMessage(error)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {estimate ? (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 rounded-[20px] bg-zinc-950 p-5 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Estimated total
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {formatAmount(estimate.total)}
              </p>
            </div>
            {estimate.total.fiatValue ? (
              <span className="text-sm text-zinc-300 dark:text-zinc-600">
                {estimate.total.fiatValue}
              </span>
            ) : null}
          </div>

          <dl className="mt-3 divide-y divide-zinc-100 dark:divide-white/8">
            {estimate.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-1">
                <div className="flex items-start justify-between gap-4 text-sm">
                  <dt className="text-zinc-600 dark:text-zinc-300">
                    {item.label}
                  </dt>
                  <dd className="text-right font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatAmount(item.amount)}
                    {item.amount.fiatValue ? (
                      <span className="ml-2 font-sans text-xs font-normal text-zinc-400 dark:text-zinc-500">
                        {item.amount.fiatValue}
                      </span>
                    ) : null}
                  </dd>
                </div>
                {item.description ? (
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </dl>

          {resolvedStatus === "error" ? (
            <div
              role="alert"
              className="mt-3 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
            >
              <CircleAlert
                size={15}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                Refresh failed: {errorMessage(error)} The previous estimate is
                retained.
              </p>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            {estimate.network ? <span>{estimate.network}</span> : null}
            {estimate.source ? <span>{estimate.source}</span> : null}
            {updatedAt ? (
              <time dateTime={updatedAt.dateTime}>{updatedAt.label}</time>
            ) : null}
          </div>
        </div>
      ) : null}

      <footer className="border-t border-zinc-100 p-4 dark:border-white/8">
        <div className="flex gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{disclaimer}</p>
        </div>
        {onRefresh ? (
          <UxSolButton
            variant="outline"
            className="mt-3 min-h-14 w-full rounded-2xl"
            disabled={resolvedStatus === "loading"}
            onClick={onRefresh}
          >
            {resolvedStatus === "loading" ? (
              <Loader2
                size={14}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw size={14} aria-hidden="true" />
            )}
            {refreshLabel}
          </UxSolButton>
        ) : null}
      </footer>
    </section>
  );
}
