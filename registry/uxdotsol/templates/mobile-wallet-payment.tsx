"use client";

import {
  MobileWalletPaymentFlow,
  type MobileWalletPaymentFlowProps,
} from "@/components/uxdotsol/flows/mobile-wallet-payment-flow";

export type MobileWalletPaymentTemplateProps = MobileWalletPaymentFlowProps & {
  heading?: string;
};

export function MobileWalletPaymentTemplate({
  heading = "Pay with a mobile wallet",
  ...props
}: MobileWalletPaymentTemplateProps) {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Solana Pay</p><h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-zinc-50">{heading}</h1></header>
        <MobileWalletPaymentFlow {...props} />
      </div>
    </main>
  );
}

export default MobileWalletPaymentTemplate;
