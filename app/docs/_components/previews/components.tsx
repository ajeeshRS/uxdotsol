"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionMessage,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";

import { SolanaProvider } from "@/components/solana-provider";
import { AddressDisplay } from "@/registry/uxdotsol/components/address-display";
import { UxSolButton } from "@/registry/uxdotsol/components/button";
import { CoinPrice } from "@/registry/uxdotsol/components/coin-price";
import {
  FeeEstimate,
  type FeeEstimateData,
  type FeeEstimateStatus,
} from "@/registry/uxdotsol/components/fee-estimate";
import { NFTCard } from "@/registry/uxdotsol/components/nft-card";
import { NFTCollectionCard } from "@/registry/uxdotsol/components/nft-card-collection";
import { SafeRecipientField } from "@/registry/uxdotsol/components/safe-recipient-field";
import { SignInWithSolana } from "@/registry/uxdotsol/components/sign-in-with-solana";
import { SolanaPayCheckout } from "@/registry/uxdotsol/components/solana-pay-checkout";
import { SolanaStatusBadge } from "@/registry/uxdotsol/components/status-badge";
import { TokenSafetyDisclosure } from "@/registry/uxdotsol/components/token-safety-disclosure";
import { TokenSwapCard } from "@/registry/uxdotsol/components/token-swap";
import {
  TransactionLifecycle,
  type TransactionSubmissionState,
} from "@/registry/uxdotsol/components/transaction-lifecycle";
import {
  TransactionProgressTimeline,
  type TransactionProgressStep,
} from "@/registry/uxdotsol/components/transaction-progress-timeline";
import {
  TransactionReceipt,
  type TransactionReceiptData,
} from "@/registry/uxdotsol/components/transaction-receipt";
import {
  TransactionReview,
  type TransactionReviewIntent,
} from "@/registry/uxdotsol/components/transaction-review";
import { useTransactionStatus } from "@/registry/uxdotsol/hooks/use-transaction-status";

import { MAINNET_USDC_MINT, PreviewWalletButton } from "./shared";

const transactionReviewIntent = {
  kind: "transfer",
  pay: { value: "1.25", symbol: "SOL", fiatValue: "≈ $182.40" },
  sender: {
    label: "Connected wallet",
    address: "4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw",
  },
  recipient: {
    label: "ux.sol",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg88R",
    verified: true,
  },
  network: { cluster: "devnet" },
  fees: [{ label: "Network fee", value: "0.000005 SOL" }],
  walletDebit: { value: "1.250005", symbol: "SOL" },
  warnings: [
    {
      id: "devnet",
      severity: "info",
      title: "Development network",
      description: "Devnet assets have no real-world value.",
    },
  ],
} satisfies TransactionReviewIntent;

function TransactionReviewPreview() {
  const [outcome, setOutcome] = useState<"review" | "approved" | "cancelled">(
    "review",
  );

  if (outcome !== "review") {
    const approved = outcome === "approved";

    return (
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#111113]"
        role="status"
        aria-live="polite"
      >
        <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {approved ? "Review approved" : "Review cancelled"}
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {approved
            ? "The parent flow can now request the wallet signature."
            : "No wallet request was made."}
        </p>
        <UxSolButton
          variant="outline"
          className="mt-5"
          onClick={() => setOutcome("review")}
        >
          Review again
        </UxSolButton>
      </div>
    );
  }

  return (
    <TransactionReview
      intent={transactionReviewIntent}
      onCancel={() => setOutcome("cancelled")}
      onConfirm={() => setOutcome("approved")}
    />
  );
}

function ButtonPreview() {
  const [lastAction, setLastAction] = useState("No action selected");

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <UxSolButton onClick={() => setLastAction("Primary selected")}>
          Primary
        </UxSolButton>
        <UxSolButton
          variant="secondary"
          onClick={() => setLastAction("Secondary selected")}
        >
          Secondary
        </UxSolButton>
        <UxSolButton
          variant="outline"
          onClick={() => setLastAction("Outline selected")}
        >
          Outline
        </UxSolButton>
        <UxSolButton
          variant="ghost"
          onClick={() => setLastAction("Ghost selected")}
        >
          Ghost
        </UxSolButton>
        <UxSolButton
          variant="destructive"
          onClick={() => setLastAction("Destructive selected")}
        >
          Disconnect
        </UxSolButton>
        <UxSolButton
          variant="success"
          onClick={() => setLastAction("Success selected")}
        >
          Success
        </UxSolButton>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        {lastAction}
      </p>
    </div>
  );
}

function SolanaPayPreview() {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#111113]">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Connect a devnet wallet to test checkout
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          The preview creates a real 0.001 SOL self-transfer, so only the devnet
          network fee is spent.
        </p>
        <div className="mt-5 flex justify-center">
          <PreviewWalletButton />
        </div>
      </div>
    );
  }

  return (
    <SolanaPayCheckout
      recipient={publicKey.toBase58()}
      amount={0.001}
      merchantName="Devnet self-checkout"
      description="Real Solana Pay transfer preview"
      message="UX.SOL checkout preview"
      orderId="Preview"
      network="devnet"
    />
  );
}

export function SafeRecipientFieldPreview() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [canContinue, setCanContinue] = useState(false);
  const [acceptedAddress, setAcceptedAddress] = useState<string | null>(null);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111113]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Check a devnet recipient
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Account details come directly from Solana RPC.
          </p>
        </div>
        <PreviewWalletButton />
      </div>

      <SafeRecipientField
        value={recipient}
        onValueChange={(nextValue) => {
          setRecipient(nextValue);
          setAcceptedAddress(null);
        }}
        connection={connection}
        sender={publicKey}
        onValidationChange={(result) => setCanContinue(result.canSubmit)}
      />

      <UxSolButton
        className="mt-4 w-full"
        size="lg"
        disabled={!canContinue}
        onClick={() => setAcceptedAddress(recipient)}
      >
        Continue to review
      </UxSolButton>

      {acceptedAddress ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-center text-xs text-emerald-600 dark:text-emerald-400"
        >
          Recipient accepted for transaction review.
        </p>
      ) : null}
    </div>
  );
}

export function TokenSafetyDisclosurePreview() {
  const [draftMint, setDraftMint] = useState(MAINNET_USDC_MINT);
  const [mint, setMint] = useState(MAINNET_USDC_MINT);

  return (
    <div className="w-full max-w-lg space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111113]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setMint(draftMint.trim());
        }}
      >
        <label
          htmlFor="token-safety-preview-mint"
          className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
        >
          Mainnet token mint
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="token-safety-preview-mint"
            value={draftMint}
            onChange={(event) => setDraftMint(event.currentTarget.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-950/10 dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:focus:ring-zinc-50/15"
          />
          <UxSolButton type="submit" disabled={!draftMint.trim()}>
            Check
          </UxSolButton>
        </div>
      </form>

      <TokenSafetyDisclosure mint={mint} />
    </div>
  );
}

export function TransactionLifecyclePreview() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | null>(null);
  const [submissionState, setSubmissionState] =
    useState<TransactionSubmissionState>("idle");
  const [submissionError, setSubmissionError] = useState<Error | null>(null);

  const submitSelfTransfer = useCallback(async () => {
    if (!publicKey) return;

    setSignature(null);
    setSubmissionError(null);
    setSubmissionState("awaiting-wallet");

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 1,
        }),
      );
      const nextSignature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
      });
      setSignature(nextSignature);
      setSubmissionState("idle");
    } catch (cause) {
      setSubmissionError(
        cause instanceof Error ? cause : new Error(String(cause)),
      );
      setSubmissionState("failed");
    }
  }, [connection, publicKey, sendTransaction]);

  function reset() {
    setSignature(null);
    setSubmissionError(null);
    setSubmissionState("idle");
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-[#111113]">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Sends a real 1-lamport devnet self-transfer. The wallet pays only the
          network fee.
        </p>
        <PreviewWalletButton />
      </div>

      <TransactionLifecycle
        client={connection}
        signature={signature}
        submissionState={submissionState}
        submissionError={submissionError}
        cluster="devnet"
        onRetry={() => void submitSelfTransfer()}
        onReset={reset}
      />

      {publicKey && !signature && submissionState === "idle" ? (
        <UxSolButton
          size="lg"
          className="w-full"
          onClick={() => void submitSelfTransfer()}
        >
          Send real devnet transaction
        </UxSolButton>
      ) : null}
    </div>
  );
}

type ParsedSystemTransfer = {
  source: string;
  destination: string;
  lamports: number;
};
function readParsedSystemTransfer(
  transaction: ParsedTransactionWithMeta,
): ParsedSystemTransfer | null {
  for (const instruction of transaction.transaction.message.instructions) {
    if (!("parsed" in instruction)) continue;
    const parsed = instruction.parsed as
      | { type?: unknown; info?: Record<string, unknown> }
      | undefined;
    if (parsed?.type !== "transfer" || !parsed.info) continue;

    const source = parsed.info.source;
    const destination = parsed.info.destination;
    const lamports = parsed.info.lamports;
    if (
      typeof source === "string" &&
      typeof destination === "string" &&
      typeof lamports === "number"
    ) {
      return { source, destination, lamports };
    }
  }

  return null;
}

function formatSol(lamports: number) {
  return (lamports / LAMPORTS_PER_SOL)
    .toFixed(9)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function TransactionReceiptPreview() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceiptData | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "awaiting-wallet" | "confirming" | "fetching" | "ready" | "error"
  >("idle");
  const [error, setError] = useState<Error | null>(null);

  const loadReceipt = useCallback(
    async (nextSignature: string) => {
      setPhase("fetching");
      setError(null);

      const transaction = await connection.getParsedTransaction(
        nextSignature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );
      if (!transaction) {
        throw new Error(
          "The RPC confirmed the signature but has not indexed its receipt details yet.",
        );
      }

      const transfer = readParsedSystemTransfer(transaction);
      const fee = transaction.meta?.fee;
      const computeUnits = transaction.meta?.computeUnitsConsumed;
      const nextReceipt: TransactionReceiptData = {
        signature: nextSignature,
        status: transaction.meta?.err ? "failed" : "confirmed",
        network: { cluster: "devnet" },
        amount: transfer
          ? {
              label: "Transferred",
              value: formatSol(transfer.lamports),
              symbol: "SOL",
            }
          : undefined,
        fee:
          typeof fee === "number"
            ? {
                label: "Actual network fee",
                value: formatSol(fee),
                symbol: "SOL",
              }
            : undefined,
        sender: transfer
          ? { label: "Parsed source", address: transfer.source }
          : undefined,
        recipient: transfer
          ? { label: "Parsed destination", address: transfer.destination }
          : undefined,
        timestamp:
          typeof transaction.blockTime === "number"
            ? new Date(transaction.blockTime * 1_000).toISOString()
            : null,
        slot: transaction.slot,
        details:
          typeof computeUnits === "number"
            ? [
                {
                  label: "Compute units",
                  value: computeUnits.toLocaleString("en-US"),
                  monospaced: true,
                },
              ]
            : undefined,
      };

      setReceipt(nextReceipt);
      setPhase("ready");
    },
    [connection],
  );

  const submitTransaction = useCallback(async () => {
    if (!publicKey) return;

    setReceipt(null);
    setSignature(null);
    setError(null);
    setPhase("awaiting-wallet");

    try {
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 1,
        }),
      );
      const nextSignature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
      });
      setSignature(nextSignature);
      setPhase("confirming");

      await connection.confirmTransaction(
        { signature: nextSignature, ...latestBlockhash },
        "confirmed",
      );
      await loadReceipt(nextSignature);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      setPhase("error");
    }
  }, [connection, loadReceipt, publicKey, sendTransaction]);

  const retryReceiptLookup = useCallback(async () => {
    if (!signature) return;

    try {
      await loadReceipt(signature);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      setPhase("error");
    }
  }, [loadReceipt, signature]);

  function reset() {
    setSignature(null);
    setReceipt(null);
    setError(null);
    setPhase("idle");
  }

  if (receipt && phase === "ready") {
    return <TransactionReceipt receipt={receipt} onDone={reset} />;
  }

  const submissionState: TransactionSubmissionState =
    phase === "awaiting-wallet"
      ? "awaiting-wallet"
      : phase === "error" && !signature
        ? "failed"
        : "idle";

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-[#111113]">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Creates a real 1-lamport devnet self-transfer, then builds the receipt
          from parsed RPC transaction data.
        </p>
        <PreviewWalletButton />
      </div>

      {signature ? (
        <TransactionLifecycle
          client={connection}
          signature={signature}
          cluster="devnet"
          showReset={false}
        />
      ) : (
        <TransactionLifecycle
          client={connection}
          submissionState={submissionState}
          submissionError={error}
          cluster="devnet"
          showReset={false}
          onRetry={() => void submitTransaction()}
        />
      )}

      {phase === "error" && signature ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p role="alert" className="text-xs text-red-700 dark:text-red-300">
            {error?.message ?? "Receipt details are unavailable."}
          </p>
          <UxSolButton
            variant="outline"
            className="mt-3 w-full"
            onClick={() => void retryReceiptLookup()}
          >
            Retry receipt lookup
          </UxSolButton>
        </div>
      ) : null}

      {publicKey && phase === "idle" ? (
        <UxSolButton
          size="lg"
          className="w-full"
          onClick={() => void submitTransaction()}
        >
          Create real devnet receipt
        </UxSolButton>
      ) : null}

      {phase === "fetching" ? (
        <p
          role="status"
          className="text-center text-xs text-zinc-500 dark:text-zinc-400"
        >
          Reading parsed transaction evidence from RPC…
        </p>
      ) : null}
    </div>
  );
}

type TimelineObservations = {
  startedAt: string | null;
  preparedAt: string | null;
  submittedAt: string | null;
  processedAt: string | null;
  confirmedAt: string | null;
  failedAt: string | null;
};

const EMPTY_TIMELINE_OBSERVATIONS: TimelineObservations = {
  startedAt: null,
  preparedAt: null,
  submittedAt: null,
  processedAt: null,
  confirmedAt: null,
  failedAt: null,
};

function timelineErrorMessage(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "The transaction failed for an unknown reason.";
  }
}

function TransactionProgressTimelinePreview() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "awaiting-wallet" | "tracking" | "failed"
  >("idle");
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  const [observed, setObserved] = useState<TimelineObservations>(
    EMPTY_TIMELINE_OBSERVATIONS,
  );
  const transaction = useTransactionStatus({
    client: connection,
    signature,
    commitment: "confirmed",
    cluster: "devnet",
  });
  const trackedStatus =
    transaction.signature === signature
      ? transaction.status
      : signature
        ? "pending"
        : "idle";
  const trackingError =
    transaction.signature === signature ? transaction.error : null;

  useEffect(() => {
    const status = trackedStatus;
    const observationTimer = window.setTimeout(() => {
      if (status === "processed") {
        setObserved((current) =>
          current.processedAt
            ? current
            : { ...current, processedAt: new Date().toISOString() },
        );
      } else if (status === "confirmed" || status === "finalized") {
        setObserved((current) =>
          current.confirmedAt
            ? current
            : { ...current, confirmedAt: new Date().toISOString() },
        );
      } else if (status === "failed" || status === "expired") {
        setObserved((current) =>
          current.failedAt
            ? current
            : { ...current, failedAt: new Date().toISOString() },
        );
      }
    }, 0);

    return () => window.clearTimeout(observationTimer);
  }, [trackedStatus]);

  const submitTransaction = useCallback(async () => {
    if (!publicKey) return;

    const startedAt = new Date().toISOString();
    setSignature(null);
    setSubmissionError(null);
    setObserved({ ...EMPTY_TIMELINE_OBSERVATIONS, startedAt });
    setPhase("preparing");

    try {
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const preparedAt = new Date().toISOString();
      setObserved((current) => ({ ...current, preparedAt }));
      setPhase("awaiting-wallet");

      const transactionRequest = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 1,
        }),
      );
      const nextSignature = await sendTransaction(
        transactionRequest,
        connection,
        { skipPreflight: false },
      );
      const submittedAt = new Date().toISOString();
      setSignature(nextSignature);
      setObserved((current) => ({ ...current, submittedAt }));
      setPhase("tracking");
    } catch (cause) {
      setSubmissionError(
        cause instanceof Error ? cause : new Error(String(cause)),
      );
      setObserved((current) => ({
        ...current,
        failedAt: new Date().toISOString(),
      }));
      setPhase("failed");
    }
  }, [connection, publicKey, sendTransaction]);

  const reset = useCallback(() => {
    setSignature(null);
    setSubmissionError(null);
    setObserved(EMPTY_TIMELINE_OBSERVATIONS);
    setPhase("idle");
  }, []);

  const steps = useMemo<readonly TransactionProgressStep[]>(() => {
    if (!observed.startedAt) return [];

    const trackingFailed =
      trackedStatus === "failed" || trackedStatus === "expired";
    const confirmed =
      trackedStatus === "confirmed" || trackedStatus === "finalized";
    const errorMessage = timelineErrorMessage(
      submissionError ?? trackingError,
    );

    return [
      {
        id: "prepare",
        title: "Prepare transaction",
        description: "Request a recent blockhash from devnet RPC.",
        timestamp:
          observed.preparedAt ??
          (phase === "failed" ? observed.failedAt : observed.startedAt),
        status: observed.preparedAt
          ? "complete"
          : phase === "failed"
            ? "failed"
            : "active",
        detail:
          phase === "failed" && !observed.preparedAt ? errorMessage : undefined,
      },
      {
        id: "wallet",
        title: "Wallet approval",
        description: "Review and sign the real 1-lamport self-transfer.",
        timestamp:
          observed.submittedAt ??
          (phase === "failed" && observed.preparedAt
            ? observed.failedAt
            : observed.preparedAt),
        status: observed.submittedAt
          ? "complete"
          : phase === "awaiting-wallet"
            ? "active"
            : phase === "failed" && observed.preparedAt
              ? "failed"
              : "pending",
        detail:
          phase === "failed" && observed.preparedAt && !signature
            ? errorMessage
            : undefined,
      },
      {
        id: "submitted",
        title: "Submitted",
        description: "The wallet returned a real network signature.",
        timestamp: observed.submittedAt,
        status: signature
          ? "complete"
          : phase === "failed"
            ? "skipped"
            : "pending",
        detail: signature ?? undefined,
      },
      {
        id: "processed",
        title: "Processed",
        description: observed.processedAt
          ? "RPC observed processed commitment."
          : confirmed
            ? "RPC first reported confirmed; no processed timestamp was inferred."
            : "Waiting for RPC to observe the signature.",
        timestamp:
          observed.processedAt ??
          (trackingFailed ? observed.failedAt : null),
        status: observed.processedAt
          ? "complete"
          : confirmed
            ? "skipped"
            : trackingFailed
              ? "failed"
              : signature
                ? "active"
                : "pending",
        detail:
          trackingFailed && !observed.processedAt ? errorMessage : undefined,
      },
      {
        id: "confirmed",
        title: "Confirmed",
        description: "Reach confirmed commitment on devnet.",
        timestamp:
          observed.confirmedAt ??
          (trackingFailed && observed.processedAt ? observed.failedAt : null),
        status: confirmed
          ? "complete"
          : trackingFailed && observed.processedAt
            ? "failed"
            : trackingFailed
              ? "skipped"
              : observed.processedAt
                ? "active"
                : "pending",
        detail:
          trackingFailed && observed.processedAt ? errorMessage : undefined,
      },
    ];
  }, [
    observed,
    phase,
    signature,
    submissionError,
    trackedStatus,
    trackingError,
  ]);

  const isConfirmed =
    trackedStatus === "confirmed" || trackedStatus === "finalized";

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-[#111113]">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Records only milestones observed from a real 1-lamport devnet
          self-transfer. The wallet pays the network fee.
        </p>
        <PreviewWalletButton />
      </div>

      <TransactionProgressTimeline
        steps={steps}
        onRetry={signature ? transaction.retry : () => void submitTransaction()}
        retryLabel={signature ? "Recheck signature" : "Try again"}
      />

      {publicKey && phase === "idle" ? (
        <UxSolButton
          size="lg"
          className="w-full"
          onClick={() => void submitTransaction()}
        >
          Start real devnet transaction
        </UxSolButton>
      ) : null}
      {isConfirmed ? (
        <UxSolButton variant="outline" className="w-full" onClick={reset}>
          Start another transaction
        </UxSolButton>
      ) : null}
    </div>
  );
}

type FeeEstimatePreviewState = {
  feePayer: string | null;
  status: FeeEstimateStatus;
  estimate: FeeEstimateData | null;
  error: Error | null;
};

const EMPTY_FEE_ESTIMATE_PREVIEW: FeeEstimatePreviewState = {
  feePayer: null,
  status: "idle",
  estimate: null,
  error: null,
};

function FeeEstimatePreview() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [result, setResult] = useState<FeeEstimatePreviewState>(
    EMPTY_FEE_ESTIMATE_PREVIEW,
  );
  const feePayer = publicKey?.toBase58() ?? null;
  const isCurrentWallet = result.feePayer === feePayer;
  const status = isCurrentWallet ? result.status : "idle";
  const estimate = isCurrentWallet ? result.estimate : null;
  const error = isCurrentWallet ? result.error : null;

  const calculateFee = useCallback(async () => {
    if (!publicKey) return;

    const requestFeePayer = publicKey.toBase58();
    setResult((current) => ({
      feePayer: requestFeePayer,
      status: "loading",
      estimate:
        current.feePayer === requestFeePayer ? current.estimate : null,
      error: null,
    }));

    try {
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: publicKey,
            lamports: 1,
          }),
        ],
      }).compileToLegacyMessage();
      const response = await connection.getFeeForMessage(message, "confirmed");

      if (response.value === null) {
        throw new Error(
          "Devnet RPC did not return a fee for the compiled transaction message.",
        );
      }

      const amount = {
        value: formatSol(response.value),
        symbol: "SOL",
      };
      setResult({
        feePayer: requestFeePayer,
        status: "success",
        error: null,
        estimate: {
          total: amount,
          items: [
            {
              id: "network-fee",
              label: "Network fee",
              amount,
              description:
                "Returned by getFeeForMessage for this compiled transfer message.",
            },
          ],
          network: "Devnet",
          source: "Solana RPC",
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (cause) {
      const nextError =
        cause instanceof Error ? cause : new Error(String(cause));
      setResult((current) => ({
        feePayer: requestFeePayer,
        status: "error",
        estimate:
          current.feePayer === requestFeePayer ? current.estimate : null,
        error: nextError,
      }));
    }
  }, [connection, publicKey]);

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-[#111113]">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Compiles a real 1-lamport devnet self-transfer message. No transaction
          is signed or submitted, so no fee is spent.
        </p>
        <PreviewWalletButton />
      </div>

      <FeeEstimate
        estimate={estimate}
        status={status}
        error={error}
        onRefresh={publicKey ? () => void calculateFee() : undefined}
        refreshLabel={
          estimate ? "Refresh from devnet RPC" : "Calculate from devnet RPC"
        }
      />
    </div>
  );
}

export const componentPreviews: Record<string, ReactNode> = {
  "address-display": (
    <div className="flex items-center justify-center p-8">
      <AddressDisplay
        address="UxSol1111111111111111111111111111111111111"
        truncate={true}
      />
    </div>
  ),
  "coin-price": (
    <div className="flex items-center justify-center p-8">
      <CoinPrice />
    </div>
  ),
  "connect-wallet-btn": (
    <div className="flex items-center justify-center p-4">
      <SolanaProvider>
        <PreviewWalletButton />
      </SolanaProvider>
    </div>
  ),
  "sign-in-with-solana": (
    <SolanaProvider>
      <div className="flex w-full max-w-md flex-col gap-3 p-4">
        <div className="flex justify-end">
          <PreviewWalletButton />
        </div>
        <SignInWithSolana />
      </div>
    </SolanaProvider>
  ),
  "solana-pay-checkout": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-115 items-center justify-center p-2 sm:p-4">
        <SolanaPayPreview />
      </div>
    </SolanaProvider>
  ),
  "transaction-review": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <TransactionReviewPreview />
    </div>
  ),
  "safe-recipient-field": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <SafeRecipientFieldPreview />
      </div>
    </SolanaProvider>
  ),
  "token-safety-disclosure": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <TokenSafetyDisclosurePreview />
    </div>
  ),
  "transaction-lifecycle": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionLifecyclePreview />
      </div>
    </SolanaProvider>
  ),
  "transaction-receipt": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionReceiptPreview />
      </div>
    </SolanaProvider>
  ),
  "transaction-progress-timeline": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionProgressTimelinePreview />
      </div>
    </SolanaProvider>
  ),
  "fee-estimate": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <FeeEstimatePreview />
      </div>
    </SolanaProvider>
  ),
  button: <ButtonPreview />,
  "nft-card": (
    <div className="flex items-center justify-center p-4">
      <NFTCard
        image="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        name="Madlads"
        collection="Madlads"
        verified={true}
        price="0.5"
        priceSymbol="SOL"
        lastSale="1.2"
        ownerAvatar="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        ownerName="Madlads"
        likes={100}
        href="https://www.madlads.com"
        tilt={true}
        tiltIntensity={28}
        className=""
      />
    </div>
  ),
  "nft-card-collection": (
    <div className="flex items-center justify-center p-4">
      <NFTCollectionCard
        bannerImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        logoImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        name="Madlads"
        verified={true}
        description="A collection of digital assets with shared artwork, metadata, and marketplace activity."
        itemCount={10000}
        ownerCount={5000}
        floorPrice="0.5"
        priceSymbol="SOL"
        volume24h="1.2k"
        floorChange={12.5}
        href="https://www.madlads.com"
        tilt={true}
        items={Array(6)
          .fill({
            image:
              "https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75",
            name: "Madlad",
            collection: "Madlads",
            verified: true,
            price: "0.5",
            priceSymbol: "SOL",
            likes: 100,
          })
          .map((item, i) => ({ ...item, id: i }))}
      />
    </div>
  ),
  "token-swap": (
    <div className="flex items-center justify-center p-4">
      <TokenSwapCard />
    </div>
  ),
  "status-badge": (
    <div className="flex items-center justify-center p-4">
      <SolanaStatusBadge />
    </div>
  ),
};
