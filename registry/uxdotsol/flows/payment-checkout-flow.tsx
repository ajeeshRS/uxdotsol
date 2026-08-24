"use client";

import { ArrowRight, Loader2, ReceiptText } from "lucide-react";
import {
  usePaymentQuote,
  type PaymentQuoteAdapter,
} from "@/hooks/uxdotsol/use-payment-quote";
import {
  SolanaPayCheckout,
  type SolanaPayCheckoutProps,
} from "@/components/uxdotsol/components/solana-pay-checkout";

export type PaymentCheckoutFlowProps = SolanaPayCheckoutProps & {
  quoteInputMint?: string;
  outputDecimals?: number;
  quoteEndpoint?: string;
  quoteAdapter?: PaymentQuoteAdapter;
};

export function PaymentCheckoutFlow({
  quoteInputMint,
  outputDecimals = 9,
  quoteEndpoint,
  quoteAdapter,
  ...checkoutProps
}: PaymentCheckoutFlowProps) {
  const outputMint = checkoutProps.splToken || "So11111111111111111111111111111111111111112";
  const atomicOutput = BigInt(
    Math.max(1, Math.round(checkoutProps.amount * 10 ** outputDecimals)),
  ).toString();
  const quote = usePaymentQuote(
    quoteInputMint
      ? {
          inputMint: quoteInputMint,
          outputMint,
          amount: atomicOutput,
          swapMode: "ExactOut",
          slippageBps: 50,
        }
      : null,
    { adapter: quoteAdapter, endpoint: quoteEndpoint },
  );

  return (
    <div className="grid w-full max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <ReceiptText size={20} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.035em] text-zinc-950 dark:text-zinc-50">
          Review payment route
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          The checkout request is authoritative. An optional provider quote shows the estimated source-token amount without executing a swap.
        </p>

        {!quoteInputMint ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300">
            Direct payment selected. No conversion quote is requested.
          </div>
        ) : quote.isLoading ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300">
            <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />
            Requesting an executable provider quote…
          </div>
        ) : quote.data ? (
          <dl className="mt-6 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm dark:divide-white/8 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Required input</dt>
              <dd className="font-mono font-semibold">{quote.data.inputAmount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Payment output</dt>
              <dd className="font-mono font-semibold">{quote.data.outputAmount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Price impact</dt>
              <dd className="font-semibold">{quote.data.priceImpactPct}%</dd>
            </div>
          </dl>
        ) : quote.error ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300" role="alert">
            <p className="font-semibold">Conversion quote unavailable</p>
            <p className="mt-1">{quote.error.message}</p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Review quote <ArrowRight size={13} aria-hidden="true" /> Pay through Solana Pay
        </div>
      </section>

      <SolanaPayCheckout {...checkoutProps} />
    </div>
  );
}

export default PaymentCheckoutFlow;
