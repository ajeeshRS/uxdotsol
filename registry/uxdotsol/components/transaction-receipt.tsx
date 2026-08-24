"use client";

import { useId, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import { AddressDisplay } from "./address-display";
import { UxSolButton } from "./button";

export type TransactionReceiptStatus = "confirmed" | "finalized" | "failed";

export type TransactionReceiptNetwork = {
  cluster: "mainnet-beta" | "devnet" | "testnet" | "localnet" | string;
  label?: string;
};

export type TransactionReceiptAmount = {
  label?: string;
  value: string;
  symbol: string;
};

export type TransactionReceiptParty = {
  label: string;
  address: string;
};

export type TransactionReceiptDetail = {
  label: string;
  value: string;
  monospaced?: boolean;
};

export type TransactionReceiptData = {
  signature: string;
  status: TransactionReceiptStatus;
  network: TransactionReceiptNetwork;
  amount?: TransactionReceiptAmount;
  fee?: TransactionReceiptAmount;
  sender?: TransactionReceiptParty;
  recipient?: TransactionReceiptParty;
  timestamp?: string | null;
  slot?: number | null;
  memo?: string | null;
  details?: TransactionReceiptDetail[];
};

export type TransactionReceiptProps = {
  receipt?: TransactionReceiptData | null;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  doneLabel?: string;
  explorer?: "solscan" | "explorer" | "xray";
  explorerUrl?: string;
  showExplorerLink?: boolean;
  showCopySignature?: boolean;
  onDone?: () => void;
  className?: string;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

function networkLabel(network: TransactionReceiptNetwork) {
  if (network.label) return network.label;
  if (network.cluster === "mainnet-beta") return "Mainnet";
  return `${network.cluster.charAt(0).toUpperCase()}${network.cluster.slice(1)}`;
}

function explorerLink(
  receipt: TransactionReceiptData,
  explorer: NonNullable<TransactionReceiptProps["explorer"]>,
  explorerUrl?: string,
) {
  if (explorerUrl) {
    return `${explorerUrl.replace(/\/$/, "")}/${receipt.signature}`;
  }

  const cluster = receipt.network.cluster;
  const clusterQuery =
    cluster === "mainnet-beta" || cluster === "custom"
      ? ""
      : `?cluster=${encodeURIComponent(cluster)}`;

  if (explorer === "explorer") {
    return `https://explorer.solana.com/tx/${receipt.signature}${clusterQuery}`;
  }
  if (explorer === "xray") {
    return `https://xray.helius.xyz/tx/${receipt.signature}${clusterQuery}`;
  }
  return `https://solscan.io/tx/${receipt.signature}${clusterQuery}`;
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function DetailRow({
  label,
  value,
  monospaced = false,
  strong = false,
}: TransactionReceiptDetail & { strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`max-w-[68%] break-words text-right text-zinc-700 dark:text-zinc-300 ${
          monospaced ? "font-mono tabular-nums" : ""
        } ${strong ? "font-semibold text-zinc-950 dark:text-zinc-50" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function SignatureActions({
  receipt,
  explorer,
  explorerUrl,
  showCopySignature,
  showExplorerLink,
}: {
  receipt: TransactionReceiptData;
  explorer: NonNullable<TransactionReceiptProps["explorer"]>;
  explorerUrl?: string;
  showCopySignature: boolean;
  showExplorerLink: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copySignature() {
    try {
      await navigator.clipboard.writeText(receipt.signature);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {showCopySignature ? (
        <button
          type="button"
          onClick={() => void copySignature()}
          className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:hover:bg-white/8 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-50/15"
          aria-label={copied ? "Signature copied" : "Copy transaction signature"}
        >
          {copied ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
        </button>
      ) : null}
      {showExplorerLink ? (
        <a
          href={explorerLink(receipt, explorer, explorerUrl)}
          target="_blank"
          rel="noreferrer"
          className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:hover:bg-white/8 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-50/15"
          aria-label="View transaction in explorer"
        >
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

export function TransactionReceipt({
  receipt,
  title,
  emptyTitle = "No receipt yet",
  emptyDescription = "A receipt becomes available after a transaction has an authoritative result.",
  doneLabel = "Done",
  explorer = "solscan",
  explorerUrl,
  showExplorerLink = true,
  showCopySignature = true,
  onDone,
  className = "",
}: TransactionReceiptProps) {
  const titleId = useId();

  if (!receipt) {
    return (
      <section
        aria-labelledby={titleId}
        className={`w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
          <FileCheck2 size={19} aria-hidden="true" />
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

  const failed = receipt.status === "failed";
  const statusLabel =
    receipt.status === "finalized"
      ? "Finalized"
      : failed
        ? "Failed"
        : "Confirmed";
  const displayTitle =
    title ?? (failed ? "Transaction failed" : "Transaction receipt");
  const network = networkLabel(receipt.network);

  return (
    <section
      aria-labelledby={titleId}
      className={`w-full max-w-lg overflow-hidden rounded-[24px] border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
    >
      <header className="border-b border-zinc-200 bg-zinc-50 px-5 py-5 text-center dark:border-white/10 dark:bg-white/[0.025]">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-2xl shadow-[0_8px_18px_rgba(0,0,0,0.12)] ${
            failed
              ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          }`}
        >
          {failed ? (
            <ShieldAlert size={22} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={22} aria-hidden="true" />
          )}
        </span>
        <h2 id={titleId} className="mt-3 text-lg font-semibold tracking-tight">
          {displayTitle}
        </h2>
        <p
          className={`mt-1 text-xs font-semibold ${
            failed
              ? "text-red-600 dark:text-red-300"
              : "text-emerald-600 dark:text-emerald-300"
          }`}
        >
          {statusLabel} on {network}
        </p>
      </header>

      <div className="space-y-4 p-6">
        {receipt.amount ? (
          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-white/12 dark:bg-white/[0.025]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {receipt.amount.label ?? "Amount"}
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-[-0.04em] tabular-nums text-zinc-950 dark:text-zinc-50">
              {receipt.amount.value}
              <span className="ml-2 text-sm tracking-normal text-zinc-500 dark:text-zinc-400">
                {receipt.amount.symbol}
              </span>
            </p>
          </div>
        ) : null}

        {receipt.sender || receipt.recipient ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {receipt.sender ? (
              <div className="min-w-0 rounded-[20px] border border-zinc-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  From
                </p>
                <p className="mt-1.5 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {receipt.sender.label}
                </p>
                <AddressDisplay
                  address={receipt.sender.address}
                  className="mt-1 min-h-7 max-w-full border-0 bg-transparent px-0 py-0 text-xs shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                />
              </div>
            ) : null}
            {receipt.recipient ? (
              <div className="min-w-0 rounded-[20px] border border-zinc-200 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  To
                </p>
                <p className="mt-1.5 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {receipt.recipient.label}
                </p>
                <AddressDisplay
                  address={receipt.recipient.address}
                  className="mt-1 min-h-7 max-w-full border-0 bg-transparent px-0 py-0 text-xs shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <dl className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 dark:divide-white/8 dark:border-white/10 dark:bg-white/[0.025]">
          <DetailRow label="Status" value={statusLabel} strong />
          <DetailRow label="Network" value={network} />
          <DetailRow
            label="Timestamp (UTC)"
            value={formatTimestamp(receipt.timestamp)}
          />
          {typeof receipt.slot === "number" ? (
            <DetailRow
              label="Slot"
              value={receipt.slot.toLocaleString("en-US")}
              monospaced
            />
          ) : null}
          {receipt.fee ? (
            <DetailRow
              label={receipt.fee.label ?? "Network fee"}
              value={`${receipt.fee.value} ${receipt.fee.symbol}`}
              monospaced
            />
          ) : null}
          {receipt.memo ? (
            <DetailRow label="Memo" value={receipt.memo} monospaced />
          ) : null}
          {(receipt.details ?? []).map((detail) => (
            <DetailRow key={`${detail.label}:${detail.value}`} {...detail} />
          ))}
        </dl>

        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-[#19191B]">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Signature
            </p>
            <p
              className="mt-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300"
              title={receipt.signature}
            >
              {receipt.signature}
            </p>
          </div>
          <SignatureActions
            receipt={receipt}
            explorer={explorer}
            explorerUrl={explorerUrl}
            showCopySignature={showCopySignature}
            showExplorerLink={showExplorerLink}
          />
        </div>

        {onDone ? (
          <UxSolButton
            size="lg"
            className="min-h-14 w-full rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
            onClick={onDone}
          >
            {doneLabel}
          </UxSolButton>
        ) : null}
      </div>
    </section>
  );
}

export default TransactionReceipt;
