"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import {
  usePaymentStatus,
  type PaymentStatusAdapter,
  type PaymentStatusCluster,
} from "@/hooks/uxdotsol/use-payment-status";
import {
  TransactionProgressTimeline,
  type TransactionProgressStep,
} from "@/components/uxdotsol/components/transaction-progress-timeline";

export type TransactionRecoveryFlowProps = {
  initialSignature?: string;
  cluster?: PaymentStatusCluster;
  endpoint?: string;
  adapter?: PaymentStatusAdapter;
  className?: string;
};

export function TransactionRecoveryFlow({
  initialSignature = "",
  cluster = "mainnet-beta",
  endpoint,
  adapter,
  className = "",
}: TransactionRecoveryFlowProps) {
  const [draft, setDraft] = useState(initialSignature);
  const [signature, setSignature] = useState(initialSignature);
  const payment = usePaymentStatus(signature, { adapter, cluster, endpoint });
  const steps = useMemo<TransactionProgressStep[]>(() => {
    if (!signature) return [];
    const status = payment.data?.status;
    const failed = status === "failed";
    const found = status && status !== "not_found";
    const confirmed = status === "confirmed" || status === "finalized";
    return [
      { id: "lookup", title: "Signature lookup", status: payment.isLoading ? "active" : payment.error ? "failed" : "complete" },
      { id: "observed", title: "Observed by RPC", status: failed ? "failed" : found ? "complete" : payment.isLoading ? "pending" : "active" },
      { id: "confirmed", title: "Confirmation", status: failed ? "skipped" : confirmed ? "complete" : found ? "active" : "pending" },
      { id: "finalized", title: "Finalization", status: status === "finalized" ? "complete" : confirmed ? "active" : "pending" },
    ];
  }, [payment.data?.status, payment.error, payment.isLoading, signature]);

  return (
    <section className={`w-full max-w-2xl rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <RotateCcw size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Recover a transaction</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">Recheck an existing signature before attempting another payment.</p>
        </div>
      </div>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSignature(draft.trim());
        }}
      >
        <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)] focus-within:ring-2 dark:border-white/12 dark:bg-[#19191B]">
          <Search size={16} className="shrink-0 text-zinc-400" aria-hidden="true" />
          <span className="sr-only">Transaction signature</span>
          <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} placeholder="Paste transaction signature" className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none" />
        </label>
        <button type="submit" className="min-h-14 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">Check</button>
      </form>

      {payment.error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" role="alert">{payment.error.message}</p>
      ) : null}
      {steps.length > 0 ? (
        <div className="mt-5">
          <TransactionProgressTimeline steps={steps} onRetry={payment.refetch} retryLabel="Check again" />
        </div>
      ) : null}
    </section>
  );
}

export default TransactionRecoveryFlow;
