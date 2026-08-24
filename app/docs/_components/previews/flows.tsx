"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { SolanaProvider } from "@/components/solana-provider";
import { MobileWalletPaymentFlow } from "@/registry/uxdotsol/flows/mobile-wallet-payment-flow";
import { PaymentCheckoutFlow } from "@/registry/uxdotsol/flows/payment-checkout-flow";
import { QuickSendFlow } from "@/registry/uxdotsol/flows/quick-send-flow";
import { TokenDiscoverySafetyFlow } from "@/registry/uxdotsol/flows/token-discovery-safety-flow";
import { TransactionRecoveryFlow } from "@/registry/uxdotsol/flows/transaction-recovery-flow";
import MerchantCheckoutTemplate from "@/registry/uxdotsol/templates/merchant-checkout";
import MobileWalletPaymentTemplate from "@/registry/uxdotsol/templates/mobile-wallet-payment";

import { PreviewWalletButton } from "./shared";

type CheckoutPreviewVariant =
  | "flow"
  | "mobile-flow"
  | "merchant-template"
  | "mobile-template";

export function ExpandedCheckoutPreview({
  variant,
}: {
  variant: CheckoutPreviewVariant;
}) {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="w-full max-w-md rounded-[24px] border border-zinc-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#111113]">
        <p className="text-sm font-semibold">Connect a devnet wallet</p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          The preview uses a real 0.001 SOL self-payment and never fabricates a
          completion state.
        </p>
        <div className="mt-5 flex justify-center">
          <PreviewWalletButton />
        </div>
      </div>
    );
  }

  const props = {
    recipient: publicKey.toBase58(),
    amount: 0.001,
    merchantName: "Devnet checkout",
    description: "Real self-payment preview",
    orderId: "Preview",
    network: "devnet" as const,
  };

  if (variant === "mobile-flow") {
    return <MobileWalletPaymentFlow {...props} />;
  }
  if (variant === "merchant-template") {
    return <MerchantCheckoutTemplate {...props} />;
  }
  if (variant === "mobile-template") {
    return <MobileWalletPaymentTemplate {...props} />;
  }
  return <PaymentCheckoutFlow {...props} />;
}

function QuickSendPreview() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const [balanceState, setBalanceState] = useState<{
    owner: string;
    label: string;
    spendable: number;
  } | null>(null);
  const owner = publicKey?.toBase58() ?? null;
  const balance = balanceState?.owner === owner ? balanceState.label : undefined;
  const spendableBalance =
    balanceState?.owner === owner ? balanceState.spendable : undefined;

  useEffect(() => {
    let active = true;

    if (!publicKey) return;

    const requestOwner = publicKey.toBase58();

    void connection
      .getBalance(publicKey, "confirmed")
      .then((lamports) => {
        if (active) {
          const sol = lamports / LAMPORTS_PER_SOL;
          setBalanceState({
            owner: requestOwner,
            label: `${sol.toFixed(4)} SOL`,
            spendable: sol,
          });
        }
      })
      .catch(() => {
        if (active) setBalanceState(null);
      });

    return () => {
      active = false;
    };
  }, [connection, publicKey]);

  const handleSend = useCallback(
    async (amount: number, recipient: string) => {
      if (!publicKey) throw new Error("Connect a wallet before sending.");

      const lamports = Math.round(amount * LAMPORTS_PER_SOL);
      if (!Number.isSafeInteger(lamports) || lamports < 1) {
        throw new Error("Enter an amount that can be represented in lamports.");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports,
        }),
      );

      return sendTransaction(transaction, connection, {
        skipPreflight: false,
      });
    },
    [connection, publicKey, sendTransaction],
  );

  if (!publicKey) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#111113]">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Connect a devnet wallet to use Quick Send
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          The preview submits a real devnet SOL transfer and tracks its actual
          signature.
        </p>
        <div className="mt-5 flex justify-center">
          <PreviewWalletButton />
        </div>
      </div>
    );
  }

  return (
    <QuickSendFlow
      sender={publicKey.toBase58()}
      senderName={wallet?.adapter.name ?? "Connected wallet"}
      recipient=""
      presets={[0.001, 0.01, 0.05, 0.1]}
      cluster="devnet"
      networkFee="Calculated by wallet"
      availableBalance={balance}
      spendableBalance={spendableBalance}
      estimatedNetworkFee={0.000005}
      connection={connection}
      onSend={handleSend}
    />
  );
}

export const flowPreviews: Record<string, ReactNode> = {
  "quick-send-flow": (
    <div className="flex w-full max-w-240 items-center justify-center p-0">
      <SolanaProvider network={WalletAdapterNetwork.Devnet}>
        <QuickSendPreview />
      </SolanaProvider>
    </div>
  ),
  "token-discovery-safety-flow": (
    <div className="flex w-full max-w-3xl items-center justify-center p-0">
      <TokenDiscoverySafetyFlow initialQuery="USDC" />
    </div>
  ),
  "payment-checkout-flow": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <ExpandedCheckoutPreview variant="flow" />
    </SolanaProvider>
  ),
  "transaction-recovery-flow": (
    <div className="flex w-full max-w-2xl items-center justify-center p-0">
      <TransactionRecoveryFlow />
    </div>
  ),
  "mobile-wallet-payment-flow": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <ExpandedCheckoutPreview variant="mobile-flow" />
    </SolanaProvider>
  ),
};
