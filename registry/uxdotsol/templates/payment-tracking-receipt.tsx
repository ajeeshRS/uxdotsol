"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  usePaymentStatus,
  type PaymentStatusCluster,
} from "@/hooks/uxdotsol/use-payment-status";
import {
  TransactionProgressTimeline,
  type TransactionProgressStep,
} from "@/components/uxdotsol/components/transaction-progress-timeline";
import { TransactionReceipt } from "@/components/uxdotsol/components/transaction-receipt";

export type PaymentTrackingReceiptTemplateProps = {
  signature?: string;
  cluster?: PaymentStatusCluster;
  className?: string;
};

export function PaymentTrackingReceiptTemplate({
  signature: controlledSignature,
  cluster = "mainnet-beta",
  className = "",
}: PaymentTrackingReceiptTemplateProps) {
  const [draft, setDraft] = useState(controlledSignature ?? "");
  const [internalSignature, setInternalSignature] = useState(controlledSignature ?? "");
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const receiptRef = useRef<HTMLDivElement>(null);
  const signature = controlledSignature ?? internalSignature;
  const payment = usePaymentStatus(signature, { cluster });
  const terminal =
    payment.data?.status === "confirmed" ||
    payment.data?.status === "finalized" ||
    payment.data?.status === "failed";
  const steps = useMemo<TransactionProgressStep[]>(() => {
    if (!signature) return [];
    const status = payment.data?.status;

    return [
      {
        id: "lookup",
        title: "Signature lookup",
        status: payment.isLoading
          ? "active"
          : payment.error
            ? "failed"
            : "complete",
        detail: payment.error?.message,
      },
      {
        id: "observed",
        title: "Observed by RPC",
        status:
          status === "failed"
            ? "failed"
            : status && status !== "not_found"
              ? "complete"
              : payment.isLoading
                ? "pending"
                : "active",
        detail:
          status === "not_found"
            ? "The signature is not currently available in RPC history."
            : undefined,
      },
      {
        id: "confirmed",
        title: "Confirmation",
        status:
          status === "failed"
            ? "skipped"
            : status === "confirmed" || status === "finalized"
              ? "complete"
              : status === "processed"
                ? "active"
                : "pending",
      },
      {
        id: "finalized",
        title: "Finalization",
        status:
          status === "finalized"
            ? "complete"
            : status === "confirmed"
              ? "active"
              : "pending",
      },
    ];
  }, [payment.data?.status, payment.error, payment.isLoading, signature]);

  useEffect(() => {
    if (!terminal || !payment.data?.signature || !receiptRef.current) return;

    const normalFrames: Keyframe[] = [
      { opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" },
      { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
    ];
    const animation = receiptRef.current.animate(
      reduceMotion ? [{ opacity: 0 }, { opacity: 1 }] : normalFrames,
      {
        duration: reduceMotion ? 200 : 220,
        easing: reduceMotion ? "ease" : "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "both",
      },
    );

    return () => animation.cancel();
  }, [terminal, payment.data?.signature, reduceMotion]);

  return (
    <main className={`min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black sm:px-6 ${className}`}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Payment tracking</p><h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-zinc-50">Track and verify receipt</h1></div>
        {!controlledSignature ? (
          <form className="mb-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); setInternalSignature(draft.trim()); }}>
            <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} placeholder="Transaction signature" className="min-h-14 min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 font-mono text-xs outline-none dark:border-white/12 dark:bg-[#19191B]" />
            <button className="rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">Track</button>
          </form>
        ) : null}
        {payment.error ? <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{payment.error.message}</p> : null}
        {terminal && payment.data ? (
          <div ref={receiptRef}>
            <TransactionReceipt
              receipt={{
                signature: payment.data.signature,
                status:
                  payment.data.status === "failed"
                    ? "failed"
                    : payment.data.status === "finalized"
                      ? "finalized"
                      : "confirmed",
                network: { cluster },
                slot: payment.data.slot,
              }}
            />
          </div>
        ) : steps.length > 0 ? (
          <TransactionProgressTimeline
            steps={steps}
            onRetry={payment.refetch}
            retryLabel="Check again"
          />
        ) : (
          <TransactionProgressTimeline />
        )}
      </div>
    </main>
  );
}

export default PaymentTrackingReceiptTemplate;
