"use client";

import { ConnectWalletBtn } from "@/registry/uxdotsol/components/connect-wallet-btn";

export const MAINNET_USDC_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const DEVNET_USDC_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export function PreviewWalletButton() {
  return <ConnectWalletBtn className="shrink-0" showMenuToggle={false} />;
}
