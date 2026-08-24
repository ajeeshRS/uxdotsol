"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Commitment } from "@solana/web3.js";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import {
  useTransactionStatus,
  type TransactionStatusClient,
  type TransactionStatusState,
  type TransactionStatusValue,
} from "@/hooks/uxdotsol/use-transaction-status";

export type TransactionSubmissionState =
  | "idle"
  | "awaiting-wallet"
  | "submitting"
  | "failed";

export type TransactionLifecycleState =
  | TransactionSubmissionState
  | TransactionStatusState;

export type TransactionLifecycleValue = Omit<
  TransactionStatusValue,
  "status"
> & {
  status: TransactionLifecycleState;
};

export type TransactionLifecycleProps = {
  signature?: string | null;
  client?: TransactionStatusClient | null;
  submissionState?: TransactionSubmissionState;
  submissionError?: Error | string | null;
  commitment?: Commitment;
  pollIntervalMs?: number;
  timeoutMs?: number;
  subscribe?: boolean;
  cluster?: "mainnet-beta" | "devnet" | "testnet" | "custom";
  explorer?: "solscan" | "explorer" | "xray";
  explorerUrl?: string;
  title?: string;
  description?: string;
  retryLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  onRetry?: () => void;
  onReset?: () => void;
  onStatusChange?: (value: TransactionLifecycleValue) => void;
  className?: string;
};

const STEP_CONTENT = [
  {
    id: "wallet",
    title: "Wallet approval",
    description: "Review and approve the request in your wallet.",
  },
  {
    id: "submitted",
    title: "Submitted",
    description: "The signed transaction has a network signature.",
  },
  {
    id: "processing",
    title: "Processing",
    description: "The cluster has observed the transaction.",
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "The requested commitment has been reached.",
  },
] as const;

const STATUS_CONTENT: Record<
  TransactionLifecycleState,
  { label: string; description: string }
> = {
  idle: {
    label: "Ready",
    description: "No wallet request or transaction signature yet.",
  },
  "awaiting-wallet": {
    label: "Waiting for wallet",
    description: "Review the request in your wallet. Nothing is submitted yet.",
  },
  submitting: {
    label: "Submitting",
    description: "The signed transaction is being sent to the network.",
  },
  pending: {
    label: "Submitted",
    description: "A signature was returned. Waiting for RPC confirmation.",
  },
  processed: {
    label: "Processed",
    description: "The cluster observed the transaction but it is not yet confirmed.",
  },
  confirmed: {
    label: "Confirmed",
    description: "The transaction reached confirmed commitment.",
  },
  finalized: {
    label: "Finalized",
    description: "The transaction reached finalized commitment.",
  },
  failed: {
    label: "Failed",
    description: "The wallet, submission, or on-chain transaction failed.",
  },
  expired: {
    label: "Confirmation timed out",
    description: "Tracking timed out. Check the signature before sending again.",
  },
};

function getErrorMessage(
  error: TransactionLifecycleProps["submissionError"] | unknown,
) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Transaction failed for an unknown reason.";
  }
}

function shortSignature(signature: string) {
  if (signature.length <= 24) return signature;
  return `${signature.slice(0, 10)}…${signature.slice(-10)}`;
}

function activeStepIndex(
  status: TransactionLifecycleState,
  hasSignature: boolean,
) {
  if (status === "idle") return -1;
  if (status === "awaiting-wallet") return 0;
  if (status === "submitting" || status === "pending") return 1;
  if (status === "processed") return 2;
  if (status === "confirmed" || status === "finalized") return 3;
  if (status === "expired") return 3;
  return hasSignature ? 2 : 0;
}

function CopySignatureButton({ signature }: { signature: string }) {
  const [copied, setCopied] = useState(false);

  async function copySignature() {
    try {
      await navigator.clipboard.writeText(signature);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copySignature()}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:hover:bg-white/8 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-50/15"
      aria-label={copied ? "Signature copied" : "Copy transaction signature"}
    >
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
    </button>
  );
}

export function TransactionLifecycle({
  signature,
  client,
  submissionState = "idle",
  submissionError,
  commitment = "confirmed",
  pollIntervalMs = 2_000,
  timeoutMs = 90_000,
  subscribe = true,
  cluster = "mainnet-beta",
  explorer = "solscan",
  explorerUrl,
  title = "Transaction progress",
  description = "Status updates come from your wallet and Solana RPC.",
  retryLabel = "Try again",
  resetLabel = "Start another",
  showReset = true,
  onRetry,
  onReset,
  onStatusChange,
  className = "",
}: TransactionLifecycleProps) {
  const titleId = useId();
  const transaction = useTransactionStatus({
    client,
    cluster,
    commitment,
    explorer,
    explorerUrl,
    pollIntervalMs,
    signature,
    subscribe,
    timeoutMs,
  });
  const callbackRef = useRef(onStatusChange);
  const lastStatusKeyRef = useRef<string | null>(null);
  const trackedStatus =
    signature && transaction.status === "idle"
      ? "pending"
      : transaction.status;
  const status: TransactionLifecycleState = signature
    ? trackedStatus
    : submissionState;
  const statusContent = STATUS_CONTENT[status];
  const submissionErrorMessage = getErrorMessage(submissionError);
  const trackingErrorMessage = getErrorMessage(transaction.error);
  const errorMessage = signature
    ? trackingErrorMessage
    : submissionErrorMessage;
  const currentStep = activeStepIndex(status, Boolean(signature));
  const isComplete = status === "confirmed" || status === "finalized";
  const isFailed = status === "failed" || status === "expired";
  const isActive =
    status === "awaiting-wallet" ||
    status === "submitting" ||
    status === "pending" ||
    status === "processed";
  const lifecycleValue = useMemo<TransactionLifecycleValue>(
    () => ({
      ...transaction,
      status,
      error: signature
        ? transaction.error
        : submissionErrorMessage
          ? new Error(submissionErrorMessage)
          : null,
      isPending: isActive,
      isTerminal: isComplete || isFailed,
    }),
    [
      isActive,
      isComplete,
      isFailed,
      signature,
      status,
      submissionErrorMessage,
      transaction,
    ],
  );
  const statusKey = [
    status,
    signature ?? "",
    transaction.confirmationStatus ?? "",
    errorMessage ?? "",
  ].join(":");

  useEffect(() => {
    callbackRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (lastStatusKeyRef.current === statusKey) return;
    lastStatusKeyRef.current = statusKey;
    callbackRef.current?.(lifecycleValue);
  }, [lifecycleValue, statusKey]);

  function retry() {
    if (signature) {
      transaction.retry();
      return;
    }
    onRetry?.();
  }

  return (
    <section
      className={`w-full rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
            isComplete
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              : isFailed
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300"
          }`}
        >
          {isActive ? (
            <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : isComplete ? (
            <CheckCircle2 size={12} aria-hidden="true" />
          ) : isFailed ? (
            <ShieldAlert size={12} aria-hidden="true" />
          ) : (
            <Clock3 size={12} aria-hidden="true" />
          )}
          {statusContent.label}
        </span>
      </div>

      <ol className="mt-5 space-y-0">
        {STEP_CONTENT.map((step, index) => {
          const complete =
            index < currentStep || (isComplete && index === currentStep);
          const active = index === currentStep && !isComplete && !isFailed;
          const failed = index === currentStep && isFailed;

          return (
            <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < STEP_CONTENT.length - 1 ? (
                <span
                  className={`absolute left-[9px] top-5 h-[calc(100%-4px)] w-px ${
                    index < currentStep
                      ? "bg-emerald-300 dark:bg-emerald-500/40"
                      : "bg-zinc-200 dark:bg-white/10"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                  complete
                    ? "bg-emerald-500 text-white"
                    : failed
                      ? "bg-red-500 text-white"
                      : active
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "bg-zinc-100 text-zinc-400 dark:bg-white/8 dark:text-zinc-500"
                }`}
              >
                {complete ? (
                  <Check size={12} aria-hidden="true" />
                ) : failed ? (
                  <ShieldAlert size={11} aria-hidden="true" />
                ) : active ? (
                  index === 0 ? (
                    <WalletCards size={11} aria-hidden="true" />
                  ) : (
                    <Loader2
                      size={11}
                      className="motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  )
                ) : (
                  <Circle size={8} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    complete
                      ? "text-emerald-700 dark:text-emerald-300"
                      : failed
                        ? "text-red-700 dark:text-red-300"
                        : active
                          ? "text-zinc-950 dark:text-zinc-50"
                          : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className={`mt-5 rounded-2xl border p-4 ${
          isFailed
            ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/8"
            : isComplete
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/8"
              : "border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.025]"
        }`}
        role="status"
        aria-live="polite"
      >
        <p
          className={`text-xs font-semibold ${
            isFailed
              ? "text-red-700 dark:text-red-300"
              : isComplete
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {statusContent.label}
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {statusContent.description}
        </p>
        {errorMessage ? (
          <p className="mt-2 break-words text-xs leading-5 text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {signature ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-[#19191B]">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Signature
            </p>
            <p
              className="mt-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300"
              title={signature}
            >
              {shortSignature(signature)}
            </p>
          </div>
          <CopySignatureButton signature={signature} />
          {transaction.explorerLink ? (
            <a
              href={transaction.explorerLink}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:hover:bg-white/8 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-50/15"
              aria-label="View transaction in explorer"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}

      {isFailed || (showReset && isComplete) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {isFailed && (signature || onRetry) ? (
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-[background-color,transform] hover:bg-zinc-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/25 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#111113]"
            >
              <RefreshCw size={14} aria-hidden="true" />
              {signature ? "Check again" : retryLabel}
            </button>
          ) : null}
          {showReset && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-zinc-100 px-5 text-sm font-semibold text-zinc-700 transition-[background-color,transform] hover:bg-zinc-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300 dark:hover:bg-white/12 dark:focus-visible:ring-white/25"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {resetLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default TransactionLifecycle;
