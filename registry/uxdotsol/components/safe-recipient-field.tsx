"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Commitment } from "@solana/kit";
import {
  CheckCircle2,
  CircleHelp,
  ClipboardPaste,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  useRecipientValidation,
  type RecipientAddressInput,
  type RecipientRpcConnection,
  type RecipientValidationValue,
} from "@/hooks/uxdotsol/use-recipient-validation";

export type SafeRecipientFieldProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onValidationChange?: (validation: RecipientValidationValue) => void;
  rpcEndpoint?: string;
  connection?: RecipientRpcConnection | null;
  sender?: RecipientAddressInput | null;
  allowSelf?: boolean;
  requireExistingAccount?: boolean;
  blockExecutableAccounts?: boolean;
  blockedAddresses?: readonly string[];
  trustedAddresses?: readonly string[];
  commitment?: Commitment;
  debounceMs?: number;
  label?: string;
  recipientLabel?: string;
  description?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  showDetails?: boolean;
  className?: string;
};

const STATUS_CONTENT = {
  idle: {
    label: "Waiting for recipient",
    icon: CircleHelp,
    color: "text-zinc-400 dark:text-zinc-500",
  },
  invalid: {
    label: "Invalid address",
    icon: ShieldAlert,
    color: "text-red-500 dark:text-red-400",
  },
  checking: {
    label: "Checking on-chain account",
    icon: Loader2,
    color: "text-zinc-500 dark:text-zinc-400",
  },
  safe: {
    label: "Recipient checked",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    label: "Review recipient",
    icon: TriangleAlert,
    color: "text-amber-600 dark:text-amber-400",
  },
  blocked: {
    label: "Recipient blocked",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
  },
  error: {
    label: "Recipient check failed",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
  },
} as const;

function shortAddress(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function getValidationSignature(validation: RecipientValidationValue) {
  return [
    validation.status,
    validation.normalizedAddress ?? "",
    validation.accountExists === null
      ? "unknown"
      : String(validation.accountExists),
    validation.executable === null ? "unknown" : String(validation.executable),
    validation.reasons.map((reason) => `${reason.code}:${reason.severity}`).join("|"),
    validation.error?.message ?? "",
  ].join(":");
}

export function SafeRecipientField({
  value,
  defaultValue = "",
  onValueChange,
  onValidationChange,
  rpcEndpoint,
  connection,
  sender,
  allowSelf = false,
  requireExistingAccount = false,
  blockExecutableAccounts = true,
  blockedAddresses,
  trustedAddresses,
  commitment = "confirmed",
  debounceMs = 300,
  label = "Recipient",
  recipientLabel,
  description = "Verify the full address before continuing.",
  placeholder = "Solana wallet address",
  name = "recipient",
  required = false,
  disabled = false,
  showDetails = true,
  className = "",
}: SafeRecipientFieldProps) {
  const inputId = useId();
  const detailsId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const onValidationChangeRef = useRef(onValidationChange);
  const lastValidationSignatureRef = useRef<string | null>(null);
  const currentValue = value ?? internalValue;
  const validation = useRecipientValidation(currentValue, {
    allowSelf,
    blockedAddresses,
    blockExecutableAccounts,
    commitment,
    connection,
    debounceMs,
    requireExistingAccount,
    rpcEndpoint,
    sender,
    trustedAddresses,
  });
  const validationSignature = getValidationSignature(validation);
  const statusContent = STATUS_CONTENT[validation.status];
  const StatusIcon = statusContent.icon;
  const showValidation = validation.status !== "idle";
  const hasDanger =
    validation.status === "invalid" ||
    validation.status === "blocked" ||
    validation.status === "error";

  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  useEffect(() => {
    if (lastValidationSignatureRef.current === validationSignature) return;
    lastValidationSignatureRef.current = validationSignature;
    onValidationChangeRef.current?.(validation);
  }, [validation, validationSignature]);

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    setClipboardError(null);
    onValueChange?.(nextValue);
  }

  async function pasteAddress() {
    try {
      const text = await navigator.clipboard.readText();
      updateValue(text.trim());
    } catch {
      setClipboardError("Clipboard access was not available.");
    }
  }

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </label>
        {recipientLabel ? (
          <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {recipientLabel}
          </span>
        ) : null}
      </div>
      <div
        className={`flex min-h-14 items-center rounded-2xl border bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] focus-within:ring-2 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)] ${
          hasDanger
            ? "border-red-300 focus-within:ring-red-500/15 dark:border-red-500/30"
            : validation.status === "warning"
              ? "border-amber-300 focus-within:ring-amber-500/15 dark:border-amber-500/30"
              : validation.status === "safe"
                ? "border-emerald-300 focus-within:ring-emerald-500/15 dark:border-emerald-500/30"
                : "border-zinc-200 focus-within:ring-zinc-950/20 dark:border-white/12 dark:focus-within:ring-white/25"
        }`}
      >
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={currentValue}
          onChange={(event) => updateValue(event.currentTarget.value.trim())}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={hasDanger ? "true" : undefined}
          aria-describedby={
            showValidation || clipboardError ? detailsId : undefined
          }
          className="min-w-0 flex-1 bg-transparent px-4 font-mono text-sm text-zinc-950 outline-none placeholder:font-sans placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />

        {showValidation ? (
          <span
            className={`mr-1.5 flex size-9 shrink-0 items-center justify-center ${statusContent.color}`}
            title={statusContent.label}
          >
            <StatusIcon
              size={16}
              className={
                validation.status === "checking" ? "motion-safe:animate-spin" : undefined
              }
              aria-hidden="true"
            />
            <span className="sr-only">{statusContent.label}</span>
          </span>
        ) : null}

        {currentValue ? (
          <button
            type="button"
            onClick={() => updateValue("")}
            disabled={disabled}
            className="mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:pointer-events-none dark:hover:bg-white/8 dark:hover:text-white dark:focus-visible:ring-white/25"
            aria-label="Clear recipient"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void pasteAddress()}
            disabled={disabled}
            className="mr-1.5 flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:pointer-events-none dark:text-zinc-400 dark:hover:bg-white/8 dark:hover:text-white dark:focus-visible:ring-white/25"
          >
            <ClipboardPaste size={14} aria-hidden="true" />
            Paste
          </button>
        )}
      </div>

      <div id={detailsId}>
        {clipboardError ? (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {clipboardError}
          </p>
        ) : showDetails && showValidation ? (
          <div
            className={`rounded-2xl border px-4 py-3.5 ${
              hasDanger
                ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/8"
                : validation.status === "warning"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/8"
                  : "border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.025]"
            }`}
            role={hasDanger ? "alert" : "status"}
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs font-semibold ${statusContent.color}`}>
                {statusContent.label}
              </p>
              {validation.status === "error" ? (
                <button
                  type="button"
                  onClick={validation.refetch}
                  className="flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  Retry
                </button>
              ) : null}
            </div>

            {validation.reasons.length > 0 ? (
              <ul className="mt-1.5 space-y-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                {validation.reasons.map((reason) => (
                  <li key={reason.code}>{reason.message}</li>
                ))}
              </ul>
            ) : validation.status === "checking" ? (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Reading the account from Solana RPC…
              </p>
            ) : null}

            {validation.accountExists && validation.owner ? (
              <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-zinc-200 pt-2 text-[11px] dark:border-white/10">
                <div>
                  <dt className="text-zinc-400 dark:text-zinc-500">Owner</dt>
                  <dd
                    className="mt-0.5 font-mono text-zinc-700 dark:text-zinc-300"
                    title={validation.owner}
                  >
                    {shortAddress(validation.owner)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-400 dark:text-zinc-500">Account</dt>
                  <dd className="mt-0.5 font-medium text-zinc-700 dark:text-zinc-300">
                    {validation.executable ? "Program" : "Non-executable"}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : (
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default SafeRecipientField;
