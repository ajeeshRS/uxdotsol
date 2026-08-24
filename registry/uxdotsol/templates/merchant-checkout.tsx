"use client";

import {
  PaymentCheckoutFlow,
  type PaymentCheckoutFlowProps,
} from "@/components/uxdotsol/flows/payment-checkout-flow";

export type MerchantCheckoutTemplateProps = PaymentCheckoutFlowProps & {
  supportEmail?: string;
};

export function MerchantCheckoutTemplate({
  supportEmail,
  ...props
}: MerchantCheckoutTemplateProps) {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Secure checkout</p><h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-zinc-50">{props.merchantName || "Merchant payment"}</h1></div>
          {supportEmail ? <a href={`mailto:${supportEmail}`} className="text-sm font-semibold text-zinc-600 hover:underline dark:text-zinc-300">Need help?</a> : null}
        </header>
        <PaymentCheckoutFlow {...props} />
      </div>
    </main>
  );
}

export default MerchantCheckoutTemplate;
