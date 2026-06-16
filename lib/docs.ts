import registry from "@/registry.json";

export type PropDoc = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentDocMeta = {
  anatomy: string[];
  states: string[];
  rationale: string;
  usage: string | string[];
  props: PropDoc[];
  functions?: PropDoc[];
  types?: PropDoc[];
  returns?: PropDoc[];
};

export const componentMeta: Record<string, ComponentDocMeta> = {
  "address-display": {
    anatomy: ["Address text", "Truncation formatting", "Copy trigger"],
    states: ["Default", "Hover", "Confirmation icon state"],
    rationale:
      "Addresses are long and hard to read. This compacts them while ensuring safe copying without missing characters.",
    usage: `import { AddressDisplay } from "@/components/address-display";

export default function App() {
  return (
    <AddressDisplay address="UxSol1111111111111111111111111111111111111" truncate={true} />
  );
}`,
    props: [
      {
        name: "address",
        type: "string",
        defaultValue: "required",
        description: "The full on-chain address string to display (e.g. a base-58 public key).",
      },
      {
        name: "truncate",
        type: "boolean",
        defaultValue: "true",
        description: "When true, addresses longer than 10 characters are shortened to AAAA...ZZZZ format.",
      },
      {
        name: "copyable",
        type: "boolean",
        defaultValue: "true",
        description: "When true, clicking copies the full address to the clipboard and shows a confirmation icon.",
      },
    ],
  },
  "connect-wallet-btn": {
    anatomy: [
      "Wallet selection trigger",
      "Status indicator",
      "Dropdown menu",
      "Account info modal",
    ],
    states: [
      "Disconnected",
      "Connecting",
      "Connected (Address displayed)",
      "Error",
    ],
    rationale:
      "Solana wallet connection is the entry point for any dApp. This component provides a premium, battle-tested UI that handles multiple wallet adapters out of the box.",
    usage: [
      `import { SolanaProvider } from "@/components/solana-provider";
import { ConnectWalletBtn } from "@/components/connect-wallet-btn";

export default function App() {
  return (
    <SolanaProvider>
      <div className="flex justify-end p-4">
        <ConnectWalletBtn />
      </div>
    </SolanaProvider>
  );
} `,
      `MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=your_key
DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=your_key`,
    ],
    props: [
      {
        name: "menuOpen",
        type: "boolean",
        defaultValue: "false",
        description: "Current open/closed state of the mobile navigation menu. Drives the hamburger ↔ close icon.",
      },
      {
        name: "onMenuToggle",
        type: "(open: boolean) => void",
        defaultValue: "undefined",
        description: "Called when the mobile menu toggle is pressed. Receives the new boolean state.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the outermost flex wrapper.",
      },
    ],
  },
  button: {
    anatomy: ["Compact pill", "Zinc surface", "Subtle stroke", "Focus ring"],
    states: ["Default", "Hover", "Active", "Focus", "Disabled"],
    rationale:
      "Buttons use the same compact zinc design system as the wallet connect controls so actions feel consistent across nav, menus, and dialogs.",
    usage: `import { UxSolButton } from "@/components/button";

export default function App() {
  return (
    <div className="flex gap-2">
      <UxSolButton>Connect Wallet</UxSolButton>
      <UxSolButton variant="secondary">Account</UxSolButton>
      <UxSolButton variant="ghost">Cancel</UxSolButton>
    </div>
  );
}`,
    props: [
      {
        name: "variant",
        type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success'",
        defaultValue: "'primary'",
        description: "Visual treatment for primary actions, soft surfaces, outlines, quiet actions, destructive actions, and success states.",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg' | 'icon'",
        defaultValue: "'md'",
        description: "Controls button height, hit target, horizontal padding, and text size.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "undefined",
        description: "Optional class names merged onto the button root.",
      },
    ],
  },
  "use-token-balance": {
    anatomy: ["Owner and mint validation", "SPL account aggregation", "Precise balance state"],
    states: ["Idle", "Loading", "Loaded", "Error"],
    rationale:
      "Aggregates every token account for the mint, preserves atomic precision, and prevents stale RPC responses from replacing newer data.",
    usage: `"use client";

import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useTokenBalance } from "@/hooks/use-token-balance";

const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

export function WalletUsdcBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const balance = useTokenBalance(publicKey, USDC_MINT, {
    connection,
    refreshIntervalMs: 15_000,
  });

  if (!publicKey) return <p>Connect your wallet to view your USDC balance.</p>;

  return (
    <section>
      <p>Available to spend</p>
      <strong>
        {balance.isLoading ? "Loading..." : \`\${balance.formattedBalance ?? "0"} USDC\`}
      </strong>
      {balance.error ? (
        <button onClick={balance.refetch}>Retry balance check</button>
      ) : null}
    </section>
  );
}`,
    props: [
      {
        name: "publicKey",
        type: "PublicKey",
        defaultValue: "required",
        description: "The target wallet address.",
      },
      {
        name: "mint",
        type: "PublicKey",
        defaultValue: "required",
        description: "The SPL token mint address.",
      },
      {
        name: "options",
        type: "TokenBalanceOptions",
        defaultValue: "{}",
        description: "Solana connection, commitment, and optional refresh interval.",
      },
    ],
  },
  "use-transaction-simulation": {
    anatomy: ["Client adapter", "Simulation runner", "Logs and compute state"],
    states: ["Idle", "Simulating", "Success", "Failed"],
    rationale:
      "Wallet prompts are expensive UX moments. Simulating first lets apps show clearer previews and block bad transactions earlier.",
    usage: `"use client";

import type {
  Connection,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { useTransactionSimulation } from "@/hooks/use-transaction-simulation";

type TransferReviewProps = {
  connection: Connection;
  transaction: Transaction | VersionedTransaction;
  onContinue: () => void;
};

export function TransferReview({
  connection,
  transaction,
  onContinue,
}: TransferReviewProps) {
  const simulation = useTransactionSimulation({ client: connection, transaction });

  return (
    <section>
      <h2>Review transfer</h2>
      <button
        onClick={() => simulation.simulate()}
        disabled={!simulation.canSimulate || simulation.isSimulating}
      >
        {simulation.isSimulating ? "Checking transfer..." : "Check before signing"}
      </button>

      {simulation.status === "success" ? (
        <p>Ready to sign. Estimated compute: {simulation.unitsConsumed ?? "unknown"} units.</p>
      ) : null}
      {simulation.hasError ? (
        <p role="alert">This transfer would fail. Review the amount and recipient.</p>
      ) : null}

      <button disabled={simulation.status !== "success"} onClick={onContinue}>
        Continue to wallet
      </button>
    </section>
  );
}`,
    props: [
      {
        name: "client",
        type: "Connection | KitRpcLike",
        defaultValue: "undefined",
        description: "web3.js connection or kit-style RPC client.",
      },
      {
        name: "transaction",
        type: "Transaction | VersionedTransaction | string | Uint8Array",
        defaultValue: "undefined",
        description: "Transaction object or base64/byte payload to simulate.",
      },
      {
        name: "commitment",
        type: "Commitment",
        defaultValue: "'processed'",
        description: "Commitment used for simulation requests.",
      },
      {
        name: "replaceRecentBlockhash",
        type: "boolean",
        defaultValue: "true",
        description: "Asks RPC to simulate with a fresh blockhash when supported.",
      },
      {
        name: "sigVerify",
        type: "boolean",
        defaultValue: "false",
        description: "Verifies signatures during versioned transaction simulation.",
      },
    ],
    functions: [
      {
        name: "simulate",
        type: "(override?: Partial<TransactionSimulationOptions>) => Promise<TransactionSimulationResult | null>",
        defaultValue: "-",
        description: "Runs simulation with hook options plus optional per-call overrides.",
      },
      {
        name: "reset",
        type: "() => void",
        defaultValue: "-",
        description: "Clears simulation state back to idle.",
      },
    ],
    types: [
      {
        name: "TransactionSimulationStatus",
        type: "'idle' | 'simulating' | 'success' | 'failed'",
        defaultValue: "-",
        description: "Finite states exposed by the hook.",
      },
      {
        name: "SimulationClient",
        type: "Connection | KitRpcLike",
        defaultValue: "-",
        description: "Supported RPC client shapes.",
      },
    ],
    returns: [
      {
        name: "status",
        type: "TransactionSimulationStatus",
        defaultValue: "'idle'",
        description: "Current simulation state.",
      },
      {
        name: "value",
        type: "SimulatedTransactionResponse | unknown | null",
        defaultValue: "null",
        description: "Raw RPC simulation response.",
      },
      {
        name: "logs / unitsConsumed",
        type: "string[] / number | null",
        defaultValue: "[] / null",
        description: "Parsed logs and compute units when RPC returns them.",
      },
      {
        name: "canSimulate / isSimulating / hasError",
        type: "boolean",
        defaultValue: "false",
        description: "Convenience flags for UI state.",
      },
    ],
  },
  "use-smart-retry": {
    anatomy: ["Retry executor", "Error classifier", "Blockhash refresh"],
    states: ["Idle", "Retrying", "Success", "Failed"],
    rationale:
      "Solana RPC errors often need different recovery paths. This hook centralizes retry timing and stale blockhash handling.",
    usage: `"use client";

import { useState } from "react";
import {
  LAMPORTS_PER_SOL,
  type Connection,
  type PublicKey,
} from "@solana/web3.js";
import { useSmartRetry } from "@/hooks/use-smart-retry";

export function SolBalanceRefresh({
  connection,
  owner,
}: {
  connection: Connection;
  owner: PublicKey;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const retry = useSmartRetry<number>({ client: connection, maxAttempts: 4 });

  async function refreshBalance() {
    setBalance(null);
    try {
      const lamports = await retry.execute(() =>
        connection.getBalance(owner, "confirmed"),
      );
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      // The hook exposes the final error for the UI.
    }
  }

  return (
    <section>
      <p>SOL balance: {balance === null ? "Not loaded" : balance.toFixed(4)}</p>
      <button disabled={retry.isRetrying} onClick={refreshBalance}>
        {retry.isRetrying
          ? \`RPC busy, retrying (\${retry.attempt}/4)...\`
          : "Refresh balance"}
      </button>
      {!retry.isRetrying && retry.error && balance === null ? (
        <p role="alert">Could not reach the Solana RPC.</p>
      ) : null}
    </section>
  );
}`,
    props: [
      {
        name: "maxAttempts",
        type: "number",
        defaultValue: "4",
        description: "Maximum operation attempts before surfacing the error.",
      },
      {
        name: "refreshBlockhash",
        type: "() => Promise<unknown>",
        defaultValue: "undefined",
        description: "Optional callback used when a stale blockhash error is detected.",
      },
      {
        name: "baseDelayMs / maxDelayMs",
        type: "number",
        defaultValue: "400 / 6000",
        description: "Exponential backoff delay bounds.",
      },
      {
        name: "shouldRetry",
        type: "(error, attempt, decision) => boolean",
        defaultValue: "decision.retryable",
        description: "Override for retry decisions after Solana error classification.",
      },
      {
        name: "onAttempt / onRetry / onSuccess / onFailure",
        type: "callbacks",
        defaultValue: "undefined",
        description: "Lifecycle callbacks for telemetry or UI updates.",
      },
    ],
    functions: [
      {
        name: "execute",
        type: "(operation: (attempt: number) => Promise<T>, override?: Partial<SmartRetryOptions<T>>) => Promise<T>",
        defaultValue: "-",
        description: "Runs an async operation with retry behavior.",
      },
      {
        name: "cancel",
        type: "() => void",
        defaultValue: "-",
        description: "Stops future retry attempts.",
      },
      {
        name: "classifySolanaRetry",
        type: "(error: unknown) => SmartRetryDecision",
        defaultValue: "-",
        description: "Classifies blockhash, rate-limit, node, simulation, and transport errors.",
      },
    ],
    types: [
      {
        name: "SolanaRetryReason",
        type: "'blockhash-expired' | 'rate-limited' | 'node-unhealthy' | 'simulation-failed' | 'transport' | 'unknown'",
        defaultValue: "-",
        description: "Known retry reason categories.",
      },
      {
        name: "SmartRetryDecision",
        type: "{ reason; retryable; refreshBlockhash }",
        defaultValue: "-",
        description: "Classifier output used by retry logic.",
      },
    ],
    returns: [
      {
        name: "isRetrying / attempt",
        type: "boolean / number",
        defaultValue: "false / 0",
        description: "Current retry activity and attempt count.",
      },
      {
        name: "error",
        type: "unknown",
        defaultValue: "null",
        description: "Last caught operation error.",
      },
    ],
  },
  "use-transaction-status": {
    anatomy: ["Signature watcher", "Subscription/polling fallback", "Explorer link"],
    states: ["Idle", "Pending", "Confirmed", "Finalized", "Failed", "Expired"],
    rationale:
      "Transaction status handling needs terminal states and cleanup. This hook keeps UI state predictable across RPC providers.",
    usage: `"use client";

import type { Connection } from "@solana/web3.js";
import { useTransactionStatus } from "@/hooks/use-transaction-status";

export function PaymentReceipt({
  connection,
  signature,
}: {
  connection: Connection;
  signature: string;
}) {
  const transaction = useTransactionStatus({
    client: connection,
    signature,
    commitment: "confirmed",
    cluster: "mainnet-beta",
  });

  return (
    <section aria-live="polite">
      <h2>Payment receipt</h2>
      <p>Status: {transaction.status}</p>
      {transaction.status === "failed" || transaction.status === "expired" ? (
        <button onClick={transaction.retry}>Check again</button>
      ) : null}
      {transaction.explorerLink ? (
        <a href={transaction.explorerLink} target="_blank" rel="noreferrer">
          View transaction
        </a>
      ) : null}
    </section>
  );
}`,
    props: [
      {
        name: "signature",
        type: "string",
        defaultValue: "undefined",
        description: "Transaction signature to watch.",
      },
      {
        name: "timeoutMs",
        type: "number",
        defaultValue: "90000",
        description: "Time before the hook reports an expired status.",
      },
      {
        name: "client",
        type: "Connection | KitRpcLike",
        defaultValue: "undefined",
        description: "RPC client used for subscription and status polling.",
      },
      {
        name: "pollIntervalMs",
        type: "number",
        defaultValue: "2000",
        description: "Polling interval used alongside or instead of subscriptions.",
      },
      {
        name: "cluster / explorer / explorerUrl",
        type: "string",
        defaultValue: "'mainnet-beta' / 'solscan' / undefined",
        description: "Explorer link controls.",
      },
    ],
    types: [
      {
        name: "TransactionStatusState",
        type: "'idle' | 'pending' | 'confirmed' | 'finalized' | 'failed' | 'expired'",
        defaultValue: "-",
        description: "Clean UI state for a watched signature.",
      },
    ],
    returns: [
      {
        name: "status",
        type: "TransactionStatusState",
        defaultValue: "'idle'",
        description: "Current signature state.",
      },
      {
        name: "confirmations / confirmationStatus",
        type: "number | null / string | null",
        defaultValue: "null",
        description: "RPC confirmation details when available.",
      },
      {
        name: "error",
        type: "SignatureResult['err'] | Error | null",
        defaultValue: "null",
        description: "Failure or timeout error.",
      },
      {
        name: "explorerLink / isPending / isTerminal",
        type: "string | null / boolean / boolean",
        defaultValue: "null / false / false",
        description: "Convenience values for rendering status UI.",
      },
    ],
  },
  "use-private-payment": {
    anatomy: [
      "API client",
      "Request state",
      "Auth/header handling",
      "Unsigned transaction builders",
      "Balance and mint readers",
    ],
    states: ["Idle", "Loading", "Success", "Error"],
    rationale:
      "This hook uses the MagicBlock Private Payments API under the hood. It wraps the HTTP endpoints in typed React actions with request state, auth headers, readable API errors, mint initialization checks, and stable helpers.",
    usage: `"use client";

import { useState } from "react";
import {
  usePrivatePayment,
  type PrivatePaymentTxResponse,
} from "@/hooks/use-private-payment";

const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export function SendPrivateUsdc({
  owner,
  recipient,
  amountAtomics,
  signAndSend,
}: {
  owner: string;
  recipient: string;
  amountAtomics: number;
  signAndSend: (tx: PrivatePaymentTxResponse) => Promise<string>;
}) {
  const payments = usePrivatePayment({ cluster: "devnet" });
  const [signature, setSignature] = useState<string | null>(null);

  async function sendPrivateUsdc() {
    setSignature(null);

    const mintStatus = await payments.isMintInitialized({ mint: USDC_MINT });

    if (!mintStatus.initialized) {
      const setupTx = await payments.initializeMint({
        payer: owner,
        mint: USDC_MINT,
      });
      await signAndSend(setupTx);
    }

    const transferTx = await payments.transfer({
      from: owner,
      to: recipient,
      mint: USDC_MINT,
      amount: amountAtomics,
      visibility: "private",
      fromBalance: "base",
      toBalance: "base",
      initIfMissing: false,
      initAtasIfMissing: false,
      initVaultIfMissing: false,
    });

    setSignature(await signAndSend(transferTx));
  }

  return (
    <div className="grid gap-2">
      <button disabled={payments.isLoading} onClick={sendPrivateUsdc}>
        {payments.isLoading ? "Sending..." : "Send private USDC"}
      </button>
      {signature ? <p>Confirmed: {signature}</p> : null}
      {payments.error ? <p>{payments.error.message}</p> : null}
    </div>
  );
}`,
    props: [
      {
        name: "endpoint",
        type: "string",
        defaultValue: "'https://payments.magicblock.app'",
        description: "Private Payments API base URL.",
      },
      {
        name: "cluster",
        type: "'mainnet' | 'devnet' | http(s) URL",
        defaultValue: "undefined",
        description: "Default cluster sent to payment API requests.",
      },
      {
        name: "validator",
        type: "string",
        defaultValue: "undefined",
        description: "Default MagicBlock validator sent to supported requests.",
      },
      {
        name: "authToken",
        type: "string",
        defaultValue: "undefined",
        description: "Default bearer token for private balance reads and authenticated transfers.",
      },
      {
        name: "headers / fetcher",
        type: "HeadersInit / typeof fetch",
        defaultValue: "undefined / fetch",
        description: "Optional default headers and custom fetch implementation. Per-request headers are merged on top.",
      },
    ],
    functions: [
      {
        name: "request",
        type: "<T>(path, init?) => Promise<T>",
        defaultValue: "-",
        description: "Low-level typed request helper. It trims endpoint slashes, merges auth/custom headers, records timing, and parses JSON/text errors.",
      },
      {
        name: "health",
        type: "() => Promise<{ status: 'ok' }>",
        defaultValue: "-",
        description: "Checks Private Payments API availability.",
      },
      {
        name: "deposit / transfer / withdraw / initializeMint",
        type: "(params) => Promise<PrivatePaymentTxResponse>",
        defaultValue: "-",
        description: "Builds unsigned SPL transactions for wallet signing. transfer can pass a per-request authToken.",
      },
      {
        name: "balance / privateBalance",
        type: "(params) => Promise<PrivatePaymentBalance>",
        defaultValue: "-",
        description: "Reads public base-chain or private ephemeral token balance.",
      },
      {
        name: "challenge / login",
        type: "(params) => Promise<{ challenge: string } | { token: string }>",
        defaultValue: "-",
        description: "Runs the wallet challenge flow used to authorize private data access.",
      },
      {
        name: "isMintInitialized",
        type: "(params) => Promise<PrivatePaymentMintInitialization>",
        defaultValue: "-",
        description: "Checks whether the private-payment transfer queue is initialized for a mint before calling initializeMint.",
      },
      {
        name: "reset / clearError",
        type: "() => void",
        defaultValue: "-",
        description: "Clears hook state completely or only clears the current error.",
      },
    ],
    types: [
      {
        name: "PrivatePaymentState",
        type: "{ status; isLoading; error; lastResponse; lastRequest }",
        defaultValue: "-",
        description: "Request lifecycle state exposed by the hook.",
      },
      {
        name: "PrivatePaymentError",
        type: "Error & { status?; payload?; path? }",
        defaultValue: "-",
        description: "Readable API error with response status, parsed payload, and endpoint path.",
      },
      {
        name: "PrivatePaymentTxResponse",
        type: "{ kind; version; transactionBase64; sendTo; recentBlockhash; lastValidBlockHeight; instructionCount; requiredSigners; validator; transferQueue?; rentPda? }",
        defaultValue: "-",
        description: "Unsigned transaction payload returned by write endpoints.",
      },
      {
        name: "PrivatePaymentCluster / BalanceLocation / Visibility",
        type: "'mainnet' | 'devnet' | URL / 'base' | 'ephemeral' / 'public' | 'private'",
        defaultValue: "-",
        description: "Shared string unions used across request configuration and transfer payloads.",
      },
      {
        name: "PrivatePaymentDepositParams / WithdrawParams",
        type: "{ owner; mint?; amount; cluster?; validator?; initIfMissing?; initAtasIfMissing?; idempotent?; ... }",
        defaultValue: "-",
        description: "Deposit and withdraw request payloads. Amount is always integer token base units.",
      },
      {
        name: "PrivatePaymentTransferParams",
        type: "{ from; to; mint; amount; visibility; fromBalance; toBalance; authToken?; ... }",
        defaultValue: "-",
        description: "Transfer request payload.",
      },
      {
        name: "PrivatePaymentInitializeMintParams / IsMintInitializedParams",
        type: "{ payer; mint; cluster?; validator? } / { mint; cluster?; validator? }",
        defaultValue: "-",
        description: "Mint setup and setup-check request payloads.",
      },
      {
        name: "PrivatePaymentChallengeParams / LoginParams",
        type: "{ pubkey; cluster?; mock? } / { pubkey; challenge; signature; cluster?; mock? }",
        defaultValue: "-",
        description: "Wallet-auth request payloads for private balance reads and authenticated transfers.",
      },
      {
        name: "PrivatePaymentBalance",
        type: "{ address; mint; ata; location; balance }",
        defaultValue: "-",
        description: "Balance response shape.",
      },
    ],
    returns: [
      {
        name: "status / isLoading",
        type: "PrivatePaymentStatus / boolean",
        defaultValue: "'idle' / false",
        description: "Current request lifecycle state.",
      },
      {
        name: "error",
        type: "PrivatePaymentError | null",
        defaultValue: "null",
        description: "Last request error.",
      },
      {
        name: "lastResponse / lastRequest",
        type: "unknown | null / PrivatePaymentRequestMeta | null",
        defaultValue: "null / null",
        description: "Latest successful response and request timing metadata.",
      },
      {
        name: "endpoint",
        type: "string",
        defaultValue: "'https://payments.magicblock.app'",
        description: "Normalized endpoint with trailing slashes removed.",
      },
    ],
  },
  "use-optimistic-transaction": {
    anatomy: ["Optimistic state", "Transaction runner", "Rollback path"],
    states: ["Idle", "Optimistic", "Confirming", "Confirmed", "Rolled back"],
    rationale:
      "Fast dApps should update immediately while still restoring prior state when a transaction or confirmation fails.",
    usage: `"use client";

import { useOptimisticTransaction } from "@/hooks/use-optimistic-transaction";

type UsdcPaymentProps = {
  currentBalance: number;
  amount: number;
  sendPayment: () => Promise<string>;
  confirmPayment: (signature: string) => Promise<void>;
};

export function UsdcPayment({
  currentBalance,
  amount,
  sendPayment,
  confirmPayment,
}: UsdcPaymentProps) {
  const payment = useOptimisticTransaction({
    initialState: { balance: currentBalance },
    apply: (state) => ({ balance: state.balance - amount }),
    transaction: sendPayment,
    confirm: confirmPayment,
  });

  async function pay() {
    try {
      await payment.run();
    } catch {
      // The balance is rolled back and the hook exposes the error.
    }
  }

  return (
    <section>
      <p>USDC balance: {payment.state.balance.toFixed(2)}</p>
      <button disabled={payment.isPending} onClick={pay}>
        {payment.isPending ? "Confirming payment..." : \`Pay \${amount} USDC\`}
      </button>
      {payment.status === "rolled-back" ? (
        <p role="alert">Payment failed. Your displayed balance was restored.</p>
      ) : null}
    </section>
  );
}`,
    props: [
      {
        name: "initialState",
        type: "TState",
        defaultValue: "required",
        description: "Initial UI state controlled by the hook.",
      },
      {
        name: "transaction",
        type: "() => Promise<TResult>",
        defaultValue: "required",
        description: "Async transaction or send+confirm operation.",
      },
      {
        name: "apply",
        type: "(state: TState) => TState",
        defaultValue: "required",
        description: "Creates the optimistic state.",
      },
      {
        name: "rollback",
        type: "(previousState, error) => TState",
        defaultValue: "previousState",
        description: "Restores or adjusts state after failure.",
      },
      {
        name: "confirm",
        type: "(result: TResult) => Promise<unknown>",
        defaultValue: "undefined",
        description: "Optional post-send confirmation step.",
      },
    ],
    functions: [
      {
        name: "run",
        type: "(override?: Partial<Options>) => Promise<TResult>",
        defaultValue: "-",
        description: "Applies optimistic state, runs transaction, confirms, and rolls back on failure.",
      },
      {
        name: "reset",
        type: "(nextState?: TState) => void",
        defaultValue: "initialState",
        description: "Resets hook state and clears result/error.",
      },
      {
        name: "setState",
        type: "Dispatch<SetStateAction<TState>>",
        defaultValue: "-",
        description: "Direct state setter for controlled UI updates.",
      },
    ],
    types: [
      {
        name: "OptimisticTransactionStatus",
        type: "'idle' | 'optimistic' | 'confirming' | 'confirmed' | 'rolled-back'",
        defaultValue: "-",
        description: "Current optimistic transaction phase.",
      },
    ],
    returns: [
      {
        name: "state / status",
        type: "TState / OptimisticTransactionStatus",
        defaultValue: "initialState / 'idle'",
        description: "Current UI state and transaction phase.",
      },
      {
        name: "error / result",
        type: "unknown / TResult | null",
        defaultValue: "null",
        description: "Failure cause or transaction result.",
      },
      {
        name: "isPending",
        type: "boolean",
        defaultValue: "false",
        description: "True during optimistic or confirming phases.",
      },
    ],
  },
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
    usage: `import { QuickSendFlow } from "@/components/quick-send-flow";

export default function App() {
  return (
    <QuickSendFlow
      sender={wallet.publicKey?.toBase58()}
      senderName="Connected wallet"
      recipientName="ux.sol"
      recipient="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg88R"
      cluster="devnet"
      onSend={async (amount) => {
        // Build, sign, and send a SOL transfer for amount.
        return "transaction_signature";
      }}
      onConfirm={async (signature) => {
        // Optional: wait for your RPC or wallet confirmation path.
      }}
    />
  );
}`,
    props: [
      {
        name: "senderName / sender",
        type: "string",
        defaultValue: "connected wallet demo",
        description: "Optional connected-wallet label and address shown in the transfer route.",
      },
      {
        name: "recipientName / recipient",
        type: "string",
        defaultValue: "demo recipient",
        description: "Human-readable recipient label and destination wallet address.",
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
        defaultValue: "'0.000005 SOL'",
        description: "Network fee label shown in the receipt summary.",
      },
      {
        name: "onSend",
        type: "(amount: number) => Promise<string>",
        defaultValue: "demo signer",
        description: "Real wallet signing and send function. Return the transaction signature.",
      },
      {
        name: "onConfirm",
        type: "(signature: string, amount: number) => Promise<unknown>",
        defaultValue: "demo delay",
        description: "Optional confirmation hook for waiting on RPC or wallet confirmation.",
      },
      {
        name: "connection / cluster",
        type: "Connection | null / string",
        defaultValue: "null",
        description: "Optional Solana RPC and cluster used for live transaction status and explorer links.",
      },
      {
        name: "onSuccess",
        type: "(signature: string, amount: number) => void",
        defaultValue: "undefined",
        description: "Called when the send flow confirms successfully.",
      },
      {
        name: "onError",
        type: "(error: Error) => void",
        defaultValue: "undefined",
        description: "Called when send or confirmation fails.",
      },
    ],
  },
  "private-transfer": {
    anatomy: [
      "Private Pay shell",
      "ConnectWalletBtn navigation",
      "Recipient and USDC amount form",
      "Mint initialization guard",
      "Wallet signing and devnet confirmation",
    ],
    states: [
      "Idle",
      "Validating",
      "Checking accounts",
      "Setting up accounts",
      "Sending",
      "Confirmed",
      "Error",
    ],
    rationale:
      "Private payment demos should prove the full path, not stop at an unsigned payload. This template wires wallet connect, Private Payments API calls, wallet signing, transaction submission, and devnet confirmation into one tested page.",
    usage: `import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import PrivateTransfer from "@/components/private-transfer";
import { SolanaProvider } from "@/components/solana-provider";

export default function App() {
  return (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <PrivateTransfer />
    </SolanaProvider>
  );
}`,
    props: [],
  },
  "nft-card": {
    anatomy: ["Artwork Image", "Tilt Container", "Like Button", "Info Footer"],
    states: ["Default", "Hover (Tilt)", "Liked"],
    rationale:
      "Providing a premium, 3D interactive feel to digital assets drastically improves user engagement and perceived application value.",
    usage: `import { NFTCard } from "@/components/nft-card";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <NFTCard
        image="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        name="Madlads"
        collection="Madlads"
        verified={true}
        price="0.5"
        priceSymbol="SOL"
        lastSale="1.2"
        ownerName="Owner"
        likes={100}
        tilt={true}
      />
    </div>
  );
}`,
    props: [
      {
        name: "image",
        type: "string",
        defaultValue: "required",
        description: "URL of the NFT artwork image.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "required",
        description: "Display name / title of the NFT.",
      },
      {
        name: "collection",
        type: "string",
        defaultValue: "undefined",
        description: "Name of the collection this NFT belongs to.",
      },
      {
        name: "verified",
        type: "boolean",
        defaultValue: "false",
        description: "When true, renders a blue verified checkmark next to the collection name.",
      },
      {
        name: "price",
        type: "string",
        defaultValue: "undefined",
        description: "Listing price as a formatted string (e.g. \"1.5\"). Omit if not listed.",
      },
      {
        name: "priceSymbol",
        type: "string",
        defaultValue: "'SOL'",
        description: "Token symbol for the price (e.g. \"SOL\", \"ETH\").",
      },
      {
        name: "lastSale",
        type: "string",
        defaultValue: "undefined",
        description: "Label for the last sale price (e.g. \"1.2 SOL\").",
      },
      {
        name: "ownerAvatar",
        type: "string",
        defaultValue: "undefined",
        description: "URL of the owner / creator avatar image.",
      },
      {
        name: "ownerName",
        type: "string",
        defaultValue: "undefined",
        description: "Display name of the owner or creator.",
      },
      {
        name: "likes",
        type: "number",
        defaultValue: "undefined",
        description: "Initial like / favourite count displayed on the artwork overlay.",
      },
      {
        name: "href",
        type: "string",
        defaultValue: "undefined",
        description: "URL to the NFT on an external marketplace. Renders an icon button on the artwork.",
      },
      {
        name: "tilt",
        type: "boolean",
        defaultValue: "false",
        description: "Enables the interactive 3D mouse-tilt effect.",
      },
      {
        name: "tiltIntensity",
        type: "number",
        defaultValue: "28",
        description: "Tilt divisor — a higher value produces a subtler rotation.",
      },
      {
        name: "onBuy",
        type: "() => void",
        defaultValue: "undefined",
        description: "Callback fired when the Buy now action button is clicked.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the card root element.",
      },
    ],
  },
  "nft-card-collection": {
    anatomy: [
      "Collection Banner & Logo",
      "Interactive Flip Modal",
      "Scrollable NFT Grid",
      "Stats Footer",
    ],
    states: ["Default", "Hover (Tilt)", "Expanded (Flipped Modal)"],
    rationale:
      "Viewing an entire collection typically redirects the user. This component introduces an interactive flip modal to view items inline without destroying context.",
    usage: `import { NFTCollectionCard } from "@/components/nft-card-collection";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <NFTCollectionCard
        bannerImage="https://example.com/banner.png"
        logoImage="https://example.com/logo.png"
        name="Mad Lads"
        verified={true}
        description="A collection of digital assets with shared artwork and metadata."
        itemCount={10000}
        tilt={true}
        items={[]}
      />
    </div>
  );
}`,
    props: [
      {
        name: "bannerImage",
        type: "string",
        defaultValue: "required",
        description: "Banner image URL displayed at the top of the card.",
      },
      {
        name: "logoImage",
        type: "string",
        defaultValue: "required",
        description: "Collection logo image URL.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "required",
        description: "Collection display name.",
      },
      {
        name: "verified",
        type: "boolean",
        defaultValue: "false",
        description: "Shows a blue verified checkmark next to the collection name.",
      },
      {
        name: "description",
        type: "string",
        defaultValue: "undefined",
        description: "Short description shown on the card and inside the modal.",
      },
      {
        name: "itemCount",
        type: "number",
        defaultValue: "undefined",
        description: "Total number of items in the collection.",
      },
      {
        name: "ownerCount",
        type: "number",
        defaultValue: "undefined",
        description: "Number of unique owners.",
      },
      {
        name: "floorPrice",
        type: "string",
        defaultValue: "undefined",
        description: "Current floor price as a formatted string (e.g. \"24.5\").",
      },
      {
        name: "priceSymbol",
        type: "string",
        defaultValue: "'SOL'",
        description: "Token symbol used for price display.",
      },
      {
        name: "volume24h",
        type: "string",
        defaultValue: "undefined",
        description: "24-hour trading volume as a formatted string.",
      },
      {
        name: "floorChange",
        type: "number",
        defaultValue: "undefined",
        description: "24-hour floor price change percentage. Positive = green badge, negative = red.",
      },
      {
        name: "href",
        type: "string",
        defaultValue: "undefined",
        description: "External marketplace URL. Renders a link button on the banner.",
      },
      {
        name: "tilt",
        type: "boolean",
        defaultValue: "false",
        description: "Enables the 3D mouse-tilt effect on the card.",
      },
      {
        name: "tiltIntensity",
        type: "number",
        defaultValue: "28",
        description: "Tilt divisor — a higher value produces a subtler rotation.",
      },
      {
        name: "onExplore",
        type: "() => void",
        defaultValue: "undefined",
        description: "Callback for the Explore collection button. Renders the button only when provided.",
      },
      {
        name: "items",
        type: "any[]",
        defaultValue: "undefined",
        description: "Array of NFT items shown in the grid inside the flip modal.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the card root element.",
      },
    ],
  },
  "coin-price": {
    anatomy: ["Token icon", "Price display", "24h change indicator", "Hover details"],
    states: ["Default", "Loading", "Error", "Expanded tooltip"],
    rationale:
      "The component is token-agnostic: pass a tokenName and optionally an API URL, and it renders the returned price payload without Solana-specific assumptions.",
    usage: [
      `import { CoinPrice } from "@/components/coin-price";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <CoinPrice tokenName="solana" />
    </div>
  );
}`,
      `# .env.local
COINGECKO_API_KEY=your_server_side_key`,
    ],
    props: [
      {
        name: "tokenName",
        type: "string",
        defaultValue: "'solana'",
        description: "Optional token name/id passed to the API as tokenName. Examples: solana, bitcoin, ethereum.",
      },
      {
        name: "apiUrl",
        type: "string",
        defaultValue: "'/api/coin-price'",
        description: "Optional backend endpoint. Keep provider keys on the server; do not pass secret-bearing URLs to the client.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "undefined",
        description: "Optional class forwarded to the outer wrapper.",
      },
    ],
  },
  "token-swap": {
    anatomy: ["Coin Icon", "Price Display", "Change Indicator"],
    states: ["Default", "Hover (Tilt)", "Expanded (Flipped Modal)"],
    rationale: "",
    usage: `import { TokenSwap } from "@/components/token-swap";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <TokenSwap />
    </div>
  );
}`,
    props: [
      {
        name: "tokens",
        type: "Token[]",
        defaultValue: "DEFAULT_TOKENS",
        description: "List of tokens available for selection in the dropdowns.",
      },
      {
        name: "defaultFrom",
        type: "Token",
        defaultValue: "tokens[0]",
        description: "Pre-selected pay-side token.",
      },
      {
        name: "defaultTo",
        type: "Token",
        defaultValue: "tokens[1]",
        description: "Pre-selected receive-side token.",
      },
      {
        name: "slippageOptions",
        type: "number[]",
        defaultValue: "[0.1, 0.5, 1.0]",
        description: "Available slippage tolerance options shown as pills (in percent).",
      },
      {
        name: "rateLabel",
        type: "string",
        defaultValue: "undefined",
        description: "Static exchange rate label used when USD prices are unavailable.",
      },
      {
        name: "networkFee",
        type: "string",
        defaultValue: "'~0.000005 SOL'",
        description: "Network fee string shown in the card footer.",
      },
      {
        name: "onSwap",
        type: "(from: Token, to: Token, amount: string) => void",
        defaultValue: "undefined",
        description: "Callback fired after the swap animation completes. Use this to trigger the real transaction.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class forwarded to the card root element.",
      },
    ],
  },

  "status-badge": {
    anatomy: ["Coin Icon", "Price Display", "Change Indicator"],
    states: ["Default", "Hover (Tilt)", "Expanded (Flipped Modal)"],
    rationale: "",
    usage: `import { StatusBadge } from "@/components/status-badge";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <StatusBadge />
    </div>
  );
}`,
    props: [
      {
        name: "size",
        type: "'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        description: "Badge size variant.",
      },
      {
        name: "onClick",
        type: "() => void",
        defaultValue: "undefined",
        description: "Optional click handler. Clicking the badge also triggers an immediate status refetch.",
      },
    ],
  },
};

export const docComponents = registry.items.map((item) => ({
  ...item,
  ...(componentMeta[item.name] || {}),
}));

export const registryHomepage = registry.homepage;

export function getDocComponent(slug: string) {
  return docComponents.find((item) => item.name === slug);
}
