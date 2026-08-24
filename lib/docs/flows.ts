import { compositionMeta, type ComponentDocMeta } from "./types";

export const flowDocs: Record<string, ComponentDocMeta> = {
  "quick-send-flow": {
    anatomy: [
      "Amount selector",
      "Wallet route",
      "Send action",
      "Confirmation status",
      "Receipt actions",
    ],
    states: ["Idle", "Sending", "Confirming", "Confirmed", "Failed"],
    rationale:
      "Sending SOL is a high-frequency wallet action. This flow keeps amount selection, signing, retry, confirmation, and receipt status in one predictable path.",
    usage: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { QuickSendFlow } from "@/components/uxdotsol/flows/quick-send-flow";

export default function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  if (!publicKey) return <p>Connect a wallet to continue.</p>;

  return (
    <QuickSendFlow
      sender={publicKey.toBase58()}
      senderName="Connected wallet"
      recipient=""
      cluster="devnet"
      connection={connection}
      networkFee="Calculated by wallet"
      onSend={async (amount, recipient) => {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(recipient),
            lamports: Math.round(amount * LAMPORTS_PER_SOL),
          }),
        );
        return sendTransaction(transaction, connection);
      }}
    />
  );
}`,
    props: [
      {
        name: "senderName / sender",
        type: "string",
        defaultValue: "'Connected wallet' / required",
        description: "Connected-wallet label and required sender address shown in the transfer route.",
      },
      {
        name: "recipientName / recipient",
        type: "string",
        defaultValue: "undefined / ''",
        description: "Optional human-readable recipient label and initial destination wallet address.",
      },
      {
        name: "tokenSymbol / presets",
        type: "string / number[]",
        defaultValue: "'SOL' / [0.1, 0.5, 1, 5]",
        description: "Token label and quick amount buttons.",
      },
      {
        name: "networkFee",
        type: "string",
        defaultValue: "'Calculated at signing'",
        description: "Honest fee state or a fee value calculated by the wallet/RPC and shown in the summary.",
      },
      {
        name: "onSend",
        type: "(amount: number, recipient: string) => Promise<string>",
        defaultValue: "required",
        description: "Required wallet signing and submission function. It must return the real transaction signature.",
      },
      {
        name: "onConfirm",
        type: "(signature: string, amount: number, recipient: string) => Promise<unknown>",
        defaultValue: "undefined",
        description: "Optional real confirmation hook. When omitted, connection tracks the submitted signature.",
      },
      {
        name: "connection / cluster",
        type: "Connection | null / string",
        defaultValue: "null",
        description: "Optional Solana RPC and cluster used for live transaction status and explorer links.",
      },
      {
        name: "onSuccess",
        type: "(signature: string, amount: number, recipient: string) => void",
        defaultValue: "undefined",
        description: "Called when the send flow confirms successfully.",
      },
      {
        name: "onError",
        type: "(error: Error) => void",
        defaultValue: "undefined",
        description: "Called when send or confirmation fails.",
      },
      {
        name: "retrySend",
        type: "boolean",
        defaultValue: "false",
        description: "Enables automatic send retries only when onSend is idempotent or can prove a prior broadcast did not land.",
      },
    ],
  },
  "token-discovery-safety-flow": compositionMeta(
    `import { TokenDiscoverySafetyFlow } from "@/components/uxdotsol/flows/token-discovery-safety-flow";

<TokenDiscoverySafetyFlow onTokenSelect={(token) => setToken(token)} />`,
    [
      {
        name: "initialQuery",
        type: "string",
        defaultValue: "''",
        description: "Initial provider search query.",
      },
      {
        name: "adapter",
        type: "TokenListAdapter",
        defaultValue: "bundled route",
        description: "Optional token-search provider adapter.",
      },
      {
        name: "onTokenSelect",
        type: "(token: TokenListItem) => void",
        defaultValue: "undefined",
        description: "Called after the user selects a searched token.",
      },
    ],
  ),
  "payment-checkout-flow": compositionMeta(
    `import { PaymentCheckoutFlow } from "@/components/uxdotsol/flows/payment-checkout-flow";

<PaymentCheckoutFlow
  recipient={merchantAddress}
  amount={0.25}
  merchantName="Example Store"
  reference={orderReference}
/>`,
    [
      {
        name: "checkout props",
        type: "SolanaPayCheckoutProps",
        defaultValue: "recipient and amount required",
        description: "Authoritative Solana Pay request and reconciliation data.",
      },
      {
        name: "quoteInputMint",
        type: "string",
        defaultValue: "undefined",
        description: "Optional source token mint used to request an ExactOut quote.",
      },
    ],
  ),
  "transaction-recovery-flow": compositionMeta(
    `import { TransactionRecoveryFlow } from "@/components/uxdotsol/flows/transaction-recovery-flow";

<TransactionRecoveryFlow cluster="mainnet-beta" />`,
    [
      {
        name: "initialSignature",
        type: "string",
        defaultValue: "''",
        description: "Signature populated when recovery begins from an interrupted payment.",
      },
      {
        name: "cluster",
        type: "'mainnet-beta' | 'devnet' | 'testnet'",
        defaultValue: "'mainnet-beta'",
        description: "Cluster searched by the payment-status adapter.",
      },
    ],
  ),
  "mobile-wallet-payment-flow": compositionMeta(
    `import { MobileWalletPaymentFlow } from "@/components/uxdotsol/flows/mobile-wallet-payment-flow";

<MobileWalletPaymentFlow
  recipient={merchantAddress}
  amount={0.25}
  reference={orderReference}
/>`,
    [
      {
        name: "props",
        type: "SolanaPayCheckoutProps",
        defaultValue: "recipient and amount required",
        description: "Solana Pay request passed to the responsive checkout.",
      },
    ],
  ),
};
