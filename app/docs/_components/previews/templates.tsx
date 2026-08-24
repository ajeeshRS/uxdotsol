"use client";

import type { ReactNode } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { SolanaProvider } from "@/components/solana-provider";
import { PaymentTrackingReceiptTemplate } from "@/registry/uxdotsol/templates/payment-tracking-receipt";
import PrivateTransfer from "@/registry/uxdotsol/templates/private-transfer";
import SplTokenTransferTemplate from "@/registry/uxdotsol/templates/spl-token-transfer";

import { ExpandedCheckoutPreview } from "./flows";
import { DEVNET_USDC_MINT } from "./shared";

export const templatePreviews: Record<string, ReactNode> = {
  "private-transfer": (
    <div className="max-h-155 w-full overflow-auto rounded-xl">
      <SolanaProvider network={WalletAdapterNetwork.Devnet}>
        <PrivateTransfer />
      </SolanaProvider>
    </div>
  ),
  "spl-token-transfer": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <SplTokenTransferTemplate
        defaultMint={DEVNET_USDC_MINT}
        cluster="devnet"
      />
    </SolanaProvider>
  ),
  "merchant-checkout": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <ExpandedCheckoutPreview variant="merchant-template" />
    </SolanaProvider>
  ),
  "payment-tracking-receipt": <PaymentTrackingReceiptTemplate cluster="devnet" />,
  "mobile-wallet-payment": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <ExpandedCheckoutPreview variant="mobile-template" />
    </SolanaProvider>
  ),
};
