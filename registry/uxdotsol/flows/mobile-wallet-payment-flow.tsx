"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, Smartphone } from "lucide-react";
import {
  SolanaPayCheckout,
  type SolanaPayCheckoutProps,
} from "@/components/uxdotsol/components/solana-pay-checkout";

export type MobileWalletPaymentFlowProps = SolanaPayCheckoutProps & {
  className?: string;
};

export function MobileWalletPaymentFlow({
  className = "",
  ...checkoutProps
}: MobileWalletPaymentFlowProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className={`grid w-full max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px] ${className}`}>
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          {isMobile ? <Smartphone size={20} aria-hidden="true" /> : <MonitorSmartphone size={20} aria-hidden="true" />}
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.035em]">Mobile wallet handoff</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {isMobile === null
            ? "Checking the current device…"
            : isMobile
              ? "Open the payment request in a wallet on this device. Return here after approval while the merchant verifies the signature."
              : "Scan the QR code with a mobile wallet. Keep this page open while the merchant verifies payment."}
        </p>
        <ol className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
          {["Open or scan the payment request", "Review recipient, token, and amount", "Approve in the wallet", "Wait for server-side verification"].map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
      <SolanaPayCheckout {...checkoutProps} />
    </div>
  );
}

export default MobileWalletPaymentFlow;
