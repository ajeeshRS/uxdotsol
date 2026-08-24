"use client";

import { useId, useState } from "react";
import {
  ArrowDown,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { AddressDisplay } from "./address-display";
import { UxSolButton } from "./button";

export type TransactionReviewKind =
  | "transfer"
  | "swap"
  | "payment"
  | "approval"
  | "custom";

export type TransactionReviewAmount = {
  value: string;
  symbol: string;
  label?: string;
  fiatValue?: string;
};

export type TransactionReviewParty = {
  label: string;
  address: string;
  badge?: string;
  verified?: boolean;
};

export type TransactionReviewNetwork = {
  cluster: "mainnet-beta" | "devnet" | "testnet" | "localnet" | string;
  label?: string;
};

export type TransactionReviewFee = {
  label: string;
  value: string;
};

export type TransactionReviewDetail = {
  label: string;
  value: string;
  monospaced?: boolean;
};

export type TransactionReviewWarning = {
  id: string;
  severity: "info" | "warning" | "danger";
  title: string;
  description: string;
  requiresAcknowledgement?: boolean;
};

export type TransactionReviewIntent = {
  kind: TransactionReviewKind;
  title?: string;
  description?: string;
  sender?: TransactionReviewParty;
  recipient?: TransactionReviewParty;
  pay: TransactionReviewAmount;
  receive?: TransactionReviewAmount;
  network: TransactionReviewNetwork;
  fees?: TransactionReviewFee[];
  walletDebit?: TransactionReviewAmount;
  memo?: string;
  details?: TransactionReviewDetail[];
  warnings?: TransactionReviewWarning[];
};

export type TransactionReviewProps = {
  intent: TransactionReviewIntent;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  disabled?: boolean;
  riskAcknowledged?: boolean;
  defaultRiskAcknowledged?: boolean;
  onRiskAcknowledgedChange?: (acknowledged: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
};

const KIND_LABELS: Record<TransactionReviewKind, string> = {
  transfer: "Transfer",
  swap: "Swap",
  payment: "Payment",
  approval: "Approval",
  custom: "Transaction",
};

const WARNING_STYLES = {
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  },
  danger: {
    icon: ShieldAlert,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  },
} as const;

function getNetworkLabel(network: TransactionReviewNetwork) {
  if (network.label) return network.label;
  if (network.cluster === "mainnet-beta") return "Mainnet";
  return `${network.cluster.charAt(0).toUpperCase()}${network.cluster.slice(1)}`;
}

function Amount({ amount }: { amount: TransactionReviewAmount }) {
  return (
    <div>
      {amount.label ? (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {amount.label}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-3xl font-semibold tracking-[-0.04em] tabular-nums text-zinc-950 dark:text-zinc-50">
          {amount.value}
        </span>
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          {amount.symbol}
        </span>
      </div>
      {amount.fiatValue ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {amount.fiatValue}
        </p>
      ) : null}
    </div>
  );
}

function Party({
  heading,
  party,
}: {
  heading: string;
  party: TransactionReviewParty;
}) {
  return (
    <div className="min-w-0 rounded-[20px] border border-zinc-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {heading}
        </p>
        {party.badge ? (
          <span className="rounded-md bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
            {party.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {party.label}
        </span>
        {party.verified ? (
          <CheckCircle2
            size={14}
            className="shrink-0 text-emerald-500"
            aria-label="Verified"
          />
        ) : null}
      </div>
      <AddressDisplay
        address={party.address}
        className="mt-2 min-h-8 max-w-full border-0 bg-transparent px-0 py-0 text-xs shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
  monospaced = false,
  strong = false,
}: TransactionReviewDetail & { strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`max-w-[65%] text-right text-zinc-700 dark:text-zinc-300 ${
          monospaced ? "font-mono tabular-nums" : ""
        } ${strong ? "font-semibold text-zinc-950 dark:text-zinc-50" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function TransactionReview({
  intent,
  confirmLabel = "Confirm transaction",
  cancelLabel = "Cancel",
  isConfirming = false,
  disabled = false,
  riskAcknowledged,
  defaultRiskAcknowledged = false,
  onRiskAcknowledgedChange,
  onConfirm,
  onCancel,
  className = "",
}: TransactionReviewProps) {
  const titleId = useId();
  const acknowledgementId = useId();
  const warnings = intent.warnings ?? [];
  const acknowledgementKey = warnings
    .filter((warning) => warning.requiresAcknowledgement)
    .map((warning) => warning.id)
    .join(":");
  const [internalAcknowledgement, setInternalAcknowledgement] = useState(() => ({
    key: acknowledgementKey,
    value: defaultRiskAcknowledged,
  }));
  const requiresAcknowledgement = acknowledgementKey.length > 0;
  const isRiskAcknowledged =
    riskAcknowledged ??
    (internalAcknowledgement.key === acknowledgementKey
      ? internalAcknowledgement.value
      : false);
  const networkLabel = getNetworkLabel(intent.network);
  const reviewTitle = intent.title ?? `Review ${KIND_LABELS[intent.kind].toLowerCase()}`;
  const confirmDisabled =
    disabled ||
    isConfirming ||
    !onConfirm ||
    (requiresAcknowledgement && !isRiskAcknowledged);

  function handleRiskAcknowledgement(acknowledged: boolean) {
    if (riskAcknowledged === undefined) {
      setInternalAcknowledgement({
        key: acknowledgementKey,
        value: acknowledged,
      });
    }
    onRiskAcknowledgedChange?.(acknowledged);
  }

  return (
    <section
      aria-labelledby={titleId}
      className={`w-full max-w-lg overflow-hidden rounded-[24px] border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-6 py-5 dark:border-white/10 dark:bg-white/[0.025]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {KIND_LABELS[intent.kind]}
          </p>
          <h2 id={titleId} className="mt-1 text-base font-semibold tracking-tight">
            {reviewTitle}
          </h2>
          {intent.description ? (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {intent.description}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
            intent.network.cluster === "mainnet-beta"
              ? "border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-[#111113] dark:text-zinc-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          {networkLabel}
        </span>
      </header>

      <div className="space-y-4 p-6">
        <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/12 dark:bg-white/[0.025]">
          <Amount amount={{ ...intent.pay, label: intent.pay.label ?? "You send" }} />
          {intent.receive ? (
            <>
              <div className="my-3 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
                <ArrowDown size={14} className="text-zinc-400" />
                <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              </div>
              <Amount
                amount={{
                  ...intent.receive,
                  label: intent.receive.label ?? "You receive",
                }}
              />
            </>
          ) : null}
        </div>

        {intent.sender || intent.recipient ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {intent.sender ? <Party heading="From" party={intent.sender} /> : null}
            {intent.recipient ? (
              <Party heading="To" party={intent.recipient} />
            ) : null}
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="space-y-2">
            {warnings.map((warning) => {
              const style = WARNING_STYLES[warning.severity];
              const WarningIcon = style.icon;

              return (
                <div
                  key={warning.id}
                  className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${style.className}`}
                  role={warning.severity === "danger" ? "alert" : "status"}
                >
                  <WarningIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold">{warning.title}</p>
                    <p className="mt-0.5 text-xs leading-5 opacity-80">
                      {warning.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <dl className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 dark:divide-white/8 dark:border-white/10 dark:bg-white/[0.025]">
          <DetailRow label="Network" value={networkLabel} />
          {(intent.fees ?? []).map((fee) => (
            <DetailRow
              key={`${fee.label}:${fee.value}`}
              label={fee.label}
              value={fee.value}
              monospaced
            />
          ))}
          {intent.memo ? (
            <DetailRow label="Memo" value={intent.memo} monospaced />
          ) : null}
          {(intent.details ?? []).map((detail) => (
            <DetailRow key={`${detail.label}:${detail.value}`} {...detail} />
          ))}
          {intent.walletDebit ? (
            <DetailRow
              label="Total wallet debit"
              value={`${intent.walletDebit.value} ${intent.walletDebit.symbol}`}
              monospaced
              strong
            />
          ) : null}
        </dl>

        {requiresAcknowledgement ? (
          <label
            htmlFor={acknowledgementId}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300"
          >
            <input
              id={acknowledgementId}
              type="checkbox"
              checked={isRiskAcknowledged}
              onChange={(event) =>
                handleRiskAcknowledgement(event.currentTarget.checked)
              }
              className="mt-0.5 size-4 shrink-0 accent-zinc-950 dark:accent-zinc-100"
            />
            I reviewed the warnings and understand the transaction risk.
          </label>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <UxSolButton
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={isConfirming || !onCancel}
            className="min-h-14 w-full rounded-2xl"
          >
            {cancelLabel}
          </UxSolButton>
          <UxSolButton
            size="lg"
            onClick={onConfirm}
            disabled={confirmDisabled}
            aria-busy={isConfirming}
            className="min-h-14 w-full rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
          >
            {isConfirming ? (
              <Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : null}
            {isConfirming ? "Confirming…" : confirmLabel}
          </UxSolButton>
        </div>
      </div>
    </section>
  );
}

export default TransactionReview;
