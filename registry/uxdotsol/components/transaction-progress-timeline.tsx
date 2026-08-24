"use client";

import { useId } from "react";
import {
  Check,
  Circle,
  CircleAlert,
  Clock3,
  ListChecks,
  Loader2,
  Minus,
} from "lucide-react";
import { UxSolButton } from "./button";

export type TransactionProgressStepStatus =
  | "pending"
  | "active"
  | "complete"
  | "failed"
  | "skipped";

export type TransactionProgressStep = {
  id: string;
  title: string;
  description?: string;
  detail?: string;
  timestamp?: string | number | Date | null;
  status: TransactionProgressStepStatus;
};

export type TransactionProgressTimelineProps = {
  steps?: readonly TransactionProgressStep[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  retryLabel?: string;
  showTimestamps?: boolean;
  compact?: boolean;
  onRetry?: () => void;
  className?: string;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

const STATUS_LABELS: Record<TransactionProgressStepStatus, string> = {
  pending: "Pending",
  active: "In progress",
  complete: "Complete",
  failed: "Failed",
  skipped: "Skipped",
};

function formatTimestamp(value: TransactionProgressStep["timestamp"]) {
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

function StepIcon({ status }: { status: TransactionProgressStepStatus }) {
  const className = "size-4";

  if (status === "complete") {
    return <Check className={className} strokeWidth={2.5} aria-hidden="true" />;
  }
  if (status === "active") {
    return (
      <Loader2
        className={`${className} animate-spin motion-reduce:animate-none`}
        aria-hidden="true"
      />
    );
  }
  if (status === "failed") {
    return <CircleAlert className={className} aria-hidden="true" />;
  }
  if (status === "skipped") {
    return <Minus className={className} aria-hidden="true" />;
  }
  return <Circle className={className} aria-hidden="true" />;
}

function stepTone(status: TransactionProgressStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (status === "active") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300";
  }
  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500";
}

export function TransactionProgressTimeline({
  steps = [],
  title = "Transaction timeline",
  description = "Milestones reported by your wallet and transaction provider.",
  emptyTitle = "No transaction history yet",
  emptyDescription = "Observed milestones will appear here after a transaction starts.",
  retryLabel = "Recheck transaction",
  showTimestamps = true,
  compact = false,
  onRetry,
  className = "",
}: TransactionProgressTimelineProps) {
  const titleId = useId();

  if (steps.length === 0) {
    return (
      <section
        aria-labelledby={titleId}
        className={`w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
          <ListChecks size={19} aria-hidden="true" />
        </span>
        <h2
          id={titleId}
          className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50"
        >
          {emptyTitle}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {emptyDescription}
        </p>
      </section>
    );
  }

  const resolvedCount = steps.filter(
    (step) => step.status === "complete" || step.status === "skipped",
  ).length;
  const hasFailure = steps.some((step) => step.status === "failed");

  return (
    <section
      aria-labelledby={titleId}
      className={`w-full max-w-lg overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
    >
      <header
        className={`border-b border-zinc-100 bg-zinc-50 dark:border-white/8 dark:bg-white/[0.025] ${compact ? "p-4" : "p-6"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="text-sm font-semibold text-zinc-950 dark:text-zinc-50"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
            {resolvedCount} of {steps.length} resolved
          </span>
        </div>
      </header>

      <ol className={compact ? "p-4" : "p-6"} aria-live="polite">
        {steps.map((step, index) => {
          const timestamp = showTimestamps
            ? formatTimestamp(step.timestamp)
            : null;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
              aria-current={step.status === "active" ? "step" : undefined}
            >
              {!isLast ? (
                <span
                  className="absolute left-[0.9375rem] top-8 h-[calc(100%-1rem)] w-px bg-zinc-200 dark:bg-white/10"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`relative z-10 flex size-8 items-center justify-center rounded-full border ${stepTone(step.status)}`}
              >
                <StepIcon status={step.status} />
                <span className="sr-only">{STATUS_LABELS[step.status]}</span>
              </span>

              <div className={isLast ? "pb-0" : compact ? "pb-4" : "pb-5"}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 pt-1.5">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </p>
                  {timestamp ? (
                    <time
                      dateTime={timestamp.dateTime}
                      className="flex items-center gap-1 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500"
                    >
                      <Clock3 size={11} aria-hidden="true" />
                      {timestamp.label}
                    </time>
                  ) : null}
                </div>
                {step.description ? (
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {step.description}
                  </p>
                ) : null}
                {step.detail ? (
                  <p className="mt-2 break-all rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-[11px] leading-4 text-zinc-600 dark:border-white/10 dark:bg-[#19191B] dark:text-zinc-300">
                    {step.detail}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {hasFailure && onRetry ? (
        <footer className="border-t border-zinc-100 p-4 dark:border-white/8">
          <UxSolButton
            variant="outline"
            className="min-h-14 w-full rounded-2xl"
            onClick={onRetry}
          >
            {retryLabel}
          </UxSolButton>
        </footer>
      ) : null}
    </section>
  );
}
