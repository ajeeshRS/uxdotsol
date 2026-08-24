import { apiHookMeta, type ComponentDocMeta } from "./types";

export const hookDocs: Record<string, ComponentDocMeta> = {
  "use-token-balance": {
    anatomy: ["Owner and mint validation", "SPL account aggregation", "Precise balance state"],
    states: ["Idle", "Loading", "Loaded", "Error"],
    rationale:
      "Aggregates every token account for the mint, preserves atomic precision, and prevents stale RPC responses from replacing newer data.",
    usage: `"use client";

import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useTokenBalance } from "@/hooks/uxdotsol/use-token-balance";

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
  "use-token-safety": {
    anatomy: [
      "Provider adapter",
      "Token metadata loader",
      "Safety assessor",
      "Normalized UI state",
    ],
    states: ["Idle", "Loading", "Safe", "Caution", "Danger", "Unknown", "Error"],
    rationale:
      "Token interfaces need more than a verified badge. This hook combines verification, suspicious-token flags, authority controls, organic activity, and holder concentration into explainable UI states without exposing provider credentials in the browser.",
    usage: [
      `"use client";

import { useTokenSafety } from "@/hooks/uxdotsol/use-token-safety";

export function TokenSafetyDisclosure({ mint }: { mint: string }) {
  const safety = useTokenSafety(mint);

  if (safety.isLoading) return <p>Checking token...</p>;
  if (safety.status === "not-found") return <p>Token information unavailable.</p>;
  if (safety.error) {
    return <button onClick={safety.refetch}>Retry safety check</button>;
  }

  return (
    <section aria-live="polite">
      <p>Risk: {safety.risk}</p>
      <ul>
        {safety.reasons.map((reason) => (
          <li key={reason.code}>{reason.message}</li>
        ))}
      </ul>
    </section>
  );
}`,
      `JUPITER_API_KEY=your_server_side_key`,
    ],
    props: [
      {
        name: "mint",
        type: "string | null | undefined",
        defaultValue: "required",
        description: "Solana token mint to assess. Empty values keep the hook idle.",
      },
      {
        name: "adapter",
        type: "TokenSafetyAdapter",
        defaultValue: "same-origin HTTP adapter",
        description: "Optional provider adapter implementing getToken. Use this to replace the bundled endpoint.",
      },
      {
        name: "endpoint",
        type: "string",
        defaultValue: "'/api/token-safety'",
        description: "Same-origin endpoint used by the default HTTP adapter.",
      },
      {
        name: "assess",
        type: "TokenSafetyAssessor",
        defaultValue: "assessTokenSafety",
        description: "Optional policy function for converting normalized metadata into risk and reasons.",
      },
      {
        name: "enabled",
        type: "boolean",
        defaultValue: "true",
        description: "Disables requests and returns the idle state when false.",
      },
      {
        name: "fetcher / headers",
        type: "typeof fetch / HeadersInit",
        defaultValue: "fetch / undefined",
        description: "Optional HTTP overrides for the default adapter.",
      },
    ],
    functions: [
      {
        name: "refetch",
        type: "() => void",
        defaultValue: "-",
        description: "Repeats the current token lookup.",
      },
      {
        name: "assessTokenSafety",
        type: "(token: TokenSafetyToken) => TokenSafetyAssessment",
        defaultValue: "-",
        description: "Default explainable policy. Suspicious or banned tokens are danger; other detected risks are caution.",
      },
      {
        name: "createTokenSafetyHttpAdapter",
        type: "(config?) => TokenSafetyAdapter",
        defaultValue: "-",
        description: "Creates a same-origin adapter with endpoint, fetch and header overrides.",
      },
    ],
    types: [
      {
        name: "TokenSafetyRisk",
        type: "'safe' | 'caution' | 'danger' | 'unknown'",
        defaultValue: "-",
        description: "Small risk vocabulary designed for disclosure UI.",
      },
      {
        name: "TokenSafetyReason",
        type: "{ code; severity; message }",
        defaultValue: "-",
        description: "Explainable signal that can be rendered directly or mapped to product copy.",
      },
      {
        name: "TokenSafetyAdapter",
        type: "{ getToken(mint, context?): Promise<TokenSafetyToken | null> }",
        defaultValue: "-",
        description: "Provider boundary used to replace Jupiter or the bundled server route.",
      },
    ],
    returns: [
      {
        name: "risk / reasons",
        type: "TokenSafetyRisk / TokenSafetyReason[]",
        defaultValue: "'unknown' / []",
        description: "Normalized risk state and its supporting explanations.",
      },
      {
        name: "token",
        type: "TokenSafetyToken | null",
        defaultValue: "null",
        description: "Normalized token identity, verification, audit, activity, liquidity, and holder data.",
      },
      {
        name: "status / isLoading",
        type: "TokenSafetyStatus / boolean",
        defaultValue: "'idle' / false",
        description: "Request lifecycle state.",
      },
      {
        name: "isVerified / isSuspicious",
        type: "boolean / boolean",
        defaultValue: "false / false",
        description: "Convenience values for common disclosure branches.",
      },
      {
        name: "error",
        type: "Error | null",
        defaultValue: "null",
        description: "Network or invalid-response error.",
      },
    ],
  },
  "use-recipient-validation": {
    anatomy: [
      "Local address validation",
      "Self, trust, and block-list policy",
      "Debounced Solana RPC lookup",
      "Normalized safety result",
    ],
    states: [
      "Idle",
      "Invalid",
      "Checking",
      "Safe",
      "Warning",
      "Blocked",
      "Error",
    ],
    rationale:
      "Recipient validation is client and RPC orchestration, not API abstraction. The hook provides deterministic local policy plus real account properties while leaving name resolution and external risk providers to separate API hooks.",
    usage: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRecipientValidation } from "@/hooks/uxdotsol/use-recipient-validation";

export function RecipientStatus({ recipient }: { recipient: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const validation = useRecipientValidation(recipient, {
    connection,
    sender: publicKey,
  });

  return (
    <div aria-live="polite">
      <p>Status: {validation.status}</p>
      {validation.reasons.map((reason) => (
        <p key={reason.code}>{reason.message}</p>
      ))}
    </div>
  );
}`,
    props: [
      {
        name: "recipient",
        type: "string | null | undefined",
        defaultValue: "required",
        description: "Recipient address to validate. Empty input keeps the hook idle.",
      },
      {
        name: "connection",
        type: "Connection | null",
        defaultValue: "undefined",
        description: "Solana RPC connection used for the real account lookup.",
      },
      {
        name: "sender / allowSelf",
        type: "string | PublicKey | null / boolean",
        defaultValue: "undefined / false",
        description: "Optional sender and explicit policy for self-transfers.",
      },
      {
        name: "requireExistingAccount / blockExecutableAccounts",
        type: "boolean / boolean",
        defaultValue: "false / true",
        description: "Policies for new addresses and executable program accounts.",
      },
      {
        name: "blockedAddresses / trustedAddresses",
        type: "readonly string[] / readonly string[]",
        defaultValue: "[] / []",
        description: "Application-owned recipient policy lists.",
      },
      {
        name: "commitment / debounceMs / enabled",
        type: "Commitment / number / boolean",
        defaultValue: "'confirmed' / 300 / true",
        description: "RPC commitment, lookup debounce, and hook enablement.",
      },
    ],
    functions: [
      {
        name: "refetch",
        type: "() => void",
        defaultValue: "-",
        description: "Repeats the RPC lookup for the current recipient.",
      },
      {
        name: "validateRecipientAddress",
        type: "(recipient, options?) => RecipientLocalValidation",
        defaultValue: "-",
        description: "Runs the synchronous address, sender, trust-list, and block-list checks without React or RPC.",
      },
    ],
    types: [
      {
        name: "RecipientValidationStatus",
        type: "'idle' | 'invalid' | 'checking' | 'safe' | 'warning' | 'blocked' | 'error'",
        defaultValue: "-",
        description: "Small status vocabulary for recipient safety UI.",
      },
      {
        name: "RecipientValidationReason",
        type: "{ code; severity; message }",
        defaultValue: "-",
        description: "Explainable local or RPC signal.",
      },
    ],
    returns: [
      {
        name: "status / reasons",
        type: "RecipientValidationStatus / RecipientValidationReason[]",
        defaultValue: "'idle' / []",
        description: "Normalized result and explanations.",
      },
      {
        name: "accountExists / executable / owner / lamports",
        type: "boolean | null / boolean | null / string | null / number | null",
        defaultValue: "null",
        description: "Current account properties read from Solana RPC.",
      },
      {
        name: "isValidAddress / isLoading / isSafe / canSubmit",
        type: "boolean",
        defaultValue: "false",
        description: "Convenience flags for form and flow orchestration.",
      },
      {
        name: "error",
        type: "Error | null",
        defaultValue: "null",
        description: "RPC lookup failure, when present.",
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
import { useTransactionSimulation } from "@/hooks/uxdotsol/use-transaction-simulation";

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
import { useSmartRetry } from "@/hooks/uxdotsol/use-smart-retry";

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
    states: [
      "Idle",
      "Pending",
      "Processed",
      "Confirmed",
      "Finalized",
      "Failed",
      "Expired",
    ],
    rationale:
      "Transaction status handling needs terminal states and cleanup. This hook keeps UI state predictable across RPC providers.",
    usage: `"use client";

import type { Connection } from "@solana/web3.js";
import { useTransactionStatus } from "@/hooks/uxdotsol/use-transaction-status";

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
        type: "'idle' | 'pending' | 'processed' | 'confirmed' | 'finalized' | 'failed' | 'expired'",
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
} from "@/hooks/uxdotsol/use-private-payment";

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

import { useOptimisticTransaction } from "@/hooks/uxdotsol/use-optimistic-transaction";

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
  "use-token-list": apiHookMeta(
    `import { useTokenList } from "@/hooks/uxdotsol/use-token-list";

const tokens = useTokenList(search, { limit: 12 });`,
    [
      {
        name: "query",
        type: "string",
        defaultValue: "required",
        description: "Name, symbol, or mint search text. Requests start at two characters.",
      },
      {
        name: "options",
        type: "{ adapter?, endpoint?, enabled?, limit? }",
        defaultValue: "{}",
        description: "Provider override, route, request control, and result limit.",
      },
    ],
  ),
  "use-token-metadata": apiHookMeta(
    `import { useTokenMetadata } from "@/hooks/uxdotsol/use-token-metadata";

const metadata = useTokenMetadata(mint);`,
    [
      {
        name: "mint",
        type: "string | null",
        defaultValue: "required",
        description: "Solana token mint to resolve.",
      },
      {
        name: "options",
        type: "{ adapter?, endpoint?, enabled? }",
        defaultValue: "{}",
        description: "Provider override, route, and request control.",
      },
    ],
  ),
  "use-priority-fee-estimate": apiHookMeta(
    `import { usePriorityFeeEstimate } from "@/hooks/uxdotsol/use-priority-fee-estimate";

const fees = usePriorityFeeEstimate(writableAccounts, { cluster: "mainnet-beta" });`,
    [
      {
        name: "writableAccounts",
        type: "readonly string[]",
        defaultValue: "[]",
        description: "Writable accounts used by RPC to select relevant recent fee samples.",
      },
      {
        name: "options",
        type: "{ cluster?, adapter?, endpoint?, enabled? }",
        defaultValue: "{}",
        description: "Cluster, provider override, route, and request control.",
      },
    ],
  ),
  "use-payment-quote": apiHookMeta(
    `import { usePaymentQuote } from "@/hooks/uxdotsol/use-payment-quote";

const quote = usePaymentQuote({
  inputMint,
  outputMint,
  amount: atomicAmount,
  swapMode: "ExactOut",
});`,
    [
      {
        name: "input",
        type: "PaymentQuoteInput | null",
        defaultValue: "required",
        description: "Token mints, atomic amount, slippage, and ExactIn or ExactOut mode.",
      },
      {
        name: "options",
        type: "{ adapter?, endpoint?, enabled? }",
        defaultValue: "{}",
        description: "Provider override, route, and request control.",
      },
    ],
  ),
  "use-payment-status": apiHookMeta(
    `import { usePaymentStatus } from "@/hooks/uxdotsol/use-payment-status";

const payment = usePaymentStatus(signature, { cluster: "devnet" });`,
    [
      {
        name: "signature",
        type: "string | null",
        defaultValue: "required",
        description: "Existing Solana transaction signature to verify.",
      },
      {
        name: "options",
        type: "{ cluster?, adapter?, endpoint?, enabled? }",
        defaultValue: "{}",
        description: "Cluster, provider override, route, and request control.",
      },
    ],
  ),
  "use-transaction-history": apiHookMeta(
    `import { useTransactionHistory } from "@/hooks/uxdotsol/use-transaction-history";

const history = useTransactionHistory(address, {
  cluster: "mainnet-beta",
  limit: 20,
});`,
    [
      {
        name: "address",
        type: "string | null",
        defaultValue: "required",
        description: "Solana address whose recent signatures should be loaded.",
      },
      {
        name: "options",
        type: "{ cluster?, limit?, before?, adapter?, endpoint?, enabled? }",
        defaultValue: "{}",
        description: "Cluster, cursor, result limit, provider override, and request control.",
      },
    ],
  ),
};
