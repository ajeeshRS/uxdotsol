"use client";

import { useMemo, useState, type ReactNode } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction } from "@solana/web3.js";

import { SolanaProvider } from "@/components/solana-provider";
import { UxSolButton } from "@/registry/uxdotsol/components/button";
import { TokenDiscoverySafetyFlow } from "@/registry/uxdotsol/flows/token-discovery-safety-flow";
import { TransactionRecoveryFlow } from "@/registry/uxdotsol/flows/transaction-recovery-flow";
import { useOptimisticTransaction } from "@/registry/uxdotsol/hooks/use-optimistic-transaction";
import { usePaymentQuote } from "@/registry/uxdotsol/hooks/use-payment-quote";
import { usePriorityFeeEstimate } from "@/registry/uxdotsol/hooks/use-priority-fee-estimate";
import { useSmartRetry } from "@/registry/uxdotsol/hooks/use-smart-retry";
import { useTokenBalance } from "@/registry/uxdotsol/hooks/use-token-balance";
import { useTokenMetadata } from "@/registry/uxdotsol/hooks/use-token-metadata";
import { useTransactionHistory } from "@/registry/uxdotsol/hooks/use-transaction-history";
import { useTransactionSimulation } from "@/registry/uxdotsol/hooks/use-transaction-simulation";
import PrivateTransfer from "@/registry/uxdotsol/templates/private-transfer";

import {
  SafeRecipientFieldPreview,
  TokenSafetyDisclosurePreview,
  TransactionLifecyclePreview,
} from "./components";
import {
  MAINNET_USDC_MINT,
  PreviewWalletButton,
  SOL_MINT,
} from "./shared";

function UseTokenBalancePreview() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const balance = useTokenBalance(
    publicKey,
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    { connection },
  );

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f4f4f4] bg-white px-6 py-5 text-center dark:border-[#141414] dark:bg-neutral-950">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Connect a devnet wallet to load its real USDC balance.
        </p>
        <PreviewWalletButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-[#f4f4f4] bg-white px-6 py-4 text-sm text-neutral-600 dark:border-[#141414] dark:bg-neutral-950 dark:text-neutral-300">
      <span>Devnet USDC balance</span>
      <span className="font-mono text-2xl font-semibold text-neutral-950 dark:text-white">
        {balance.isLoading
          ? "Loading…"
          : `${balance.formattedBalance ?? "0"} USDC`}
      </span>
      {balance.error ? (
        <p role="alert" className="max-w-xs text-center text-xs text-red-500">
          {balance.error.message}
        </p>
      ) : null}
      <UxSolButton
        size="sm"
        variant="outline"
        onClick={balance.refetch}
        disabled={balance.isLoading}
      >
        Refresh
      </UxSolButton>
    </div>
  );
}
function TransactionSimulationPreview() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const transaction = useMemo(() => {
    if (!publicKey) return null;

    return new Transaction({ feePayer: publicKey }).add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey,
        lamports: 1,
      }),
    );
  }, [publicKey]);
  const simulation = useTransactionSimulation({
    client: connection,
    transaction,
  });

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111113]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Simulate a self-transfer
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Runs a real devnet simulation. No transaction is signed or sent.
          </p>
        </div>
        <PreviewWalletButton />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-white/10 dark:bg-white/[0.025]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500 dark:text-zinc-400">Status</span>
          <span className="font-semibold capitalize text-zinc-800 dark:text-zinc-200">
            {simulation.status}
          </span>
        </div>
        {simulation.status === "success" ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-zinc-500 dark:text-zinc-400">
              Compute units
            </span>
            <span className="font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
              {simulation.unitsConsumed ?? "Unavailable"}
            </span>
          </div>
        ) : null}
        {simulation.logs.length > 0 ? (
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            RPC returned {simulation.logs.length} program log
            {simulation.logs.length === 1 ? "" : "s"}.
          </p>
        ) : null}
        {simulation.hasError ? (
          <p role="alert" className="mt-2 text-red-600 dark:text-red-400">
            {simulation.error?.message ??
              "The RPC simulation returned an on-chain error."}
          </p>
        ) : null}
      </div>

      <UxSolButton
        size="lg"
        className="mt-4 w-full"
        disabled={!simulation.canSimulate || simulation.isSimulating}
        onClick={() => void simulation.simulate()}
      >
        {publicKey
          ? simulation.isSimulating
            ? "Simulating through RPC…"
            : "Run real simulation"
          : "Connect wallet to simulate"}
      </UxSolButton>
    </div>
  );
}

type LatestBlockhashPreview = {
  blockhash: string;
  lastValidBlockHeight: number;
};

function SmartRetryPreview() {
  const { connection } = useConnection();
  const retry = useSmartRetry<LatestBlockhashPreview>({
    client: connection,
    maxAttempts: 4,
  });
  const [latest, setLatest] = useState<LatestBlockhashPreview | null>(null);

  async function readLatestBlockhash() {
    setLatest(null);
    try {
      setLatest(
        await retry.execute(() => connection.getLatestBlockhash("confirmed")),
      );
    } catch {
      // The hook exposes the final RPC error below.
    }
  }

  const retryError =
    retry.error instanceof Error
      ? retry.error.message
      : retry.error
        ? String(retry.error)
        : null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111113]">
      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Resilient RPC read
      </p>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Reads the current devnet blockhash and retries only classified transport
        or node failures.
      </p>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-white/10 dark:bg-white/[0.025]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-500 dark:text-zinc-400">Attempt</span>
          <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
            {retry.attempt || "Not started"}
          </span>
        </div>
        {latest ? (
          <>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Latest blockhash
            </p>
            <p
              className="mt-1 truncate font-mono text-zinc-800 dark:text-zinc-200"
              title={latest.blockhash}
            >
              {latest.blockhash}
            </p>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Last valid block height: {latest.lastValidBlockHeight}
            </p>
          </>
        ) : null}
        {retryError ? (
          <p role="alert" className="mt-3 text-red-600 dark:text-red-400">
            {retryError}
          </p>
        ) : null}
      </div>

      <UxSolButton
        size="lg"
        className="mt-4 w-full"
        disabled={retry.isRetrying}
        onClick={() => void readLatestBlockhash()}
      >
        {retry.isRetrying ? "Reading devnet RPC…" : "Read latest blockhash"}
      </UxSolButton>
    </div>
  );
}

function OptimisticTransactionPreview() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const transaction = useOptimisticTransaction({
    initialState: { displayedTransfers: 0 },
    apply: (state) => ({
      displayedTransfers: state.displayedTransfers + 1,
    }),
    transaction: async () => {
      if (!publicKey) throw new Error("Connect a devnet wallet first.");

      const nextTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 1,
        }),
      );
      return sendTransaction(nextTransaction, connection, {
        skipPreflight: false,
      });
    },
    confirm: async (signature) => {
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed",
      );
      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        );
      }
    },
  });

  async function runTransaction() {
    try {
      await transaction.run();
    } catch {
      // Rollback and the failure reason are rendered from hook state.
    }
  }

  const transactionError =
    transaction.error instanceof Error
      ? transaction.error.message
      : transaction.error
        ? String(transaction.error)
        : null;

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111113]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Optimistic devnet transaction
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            The count updates immediately, then commits only after real RPC
            confirmation or rolls back on failure.
          </p>
        </div>
        <PreviewWalletButton />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Displayed transfers
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {transaction.state.displayedTransfers}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Hook state
          </p>
          <p className="mt-2 text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-200">
            {transaction.status.replace("-", " ")}
          </p>
        </div>
      </div>

      {transaction.result ? (
        <a
          href={`https://solscan.io/tx/${transaction.result}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block truncate rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs text-blue-600 hover:bg-zinc-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-white/5"
        >
          {transaction.result}
        </a>
      ) : null}

      {transactionError ? (
        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
          {transactionError}
        </p>
      ) : null}

      <UxSolButton
        size="lg"
        className="mt-4 w-full"
        disabled={!publicKey || transaction.isPending}
        onClick={() => void runTransaction()}
      >
        {publicKey
          ? transaction.isPending
            ? "Waiting for real confirmation…"
            : "Send 1-lamport self-transfer"
          : "Connect wallet to continue"}
      </UxSolButton>
    </div>
  );
}
function ApiHookCard({
  children,
  error,
  onRefresh,
  status,
  title,
  updatedAt,
}: {
  children?: ReactNode;
  error?: string | null;
  onRefresh: () => void;
  status: string;
  title: string;
  updatedAt?: string | null;
}) {
  return (
    <section className="w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#111113]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </p>
          <p className="mt-1 text-xs capitalize text-zinc-500 dark:text-zinc-400">
            {status}
            {updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <UxSolButton size="sm" variant="outline" onClick={onRefresh}>
          Refresh
        </UxSolButton>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function TokenMetadataPreview() {
  const metadata = useTokenMetadata(MAINNET_USDC_MINT);

  return (
    <ApiHookCard
      title="USDC token metadata"
      status={metadata.status}
      updatedAt={metadata.updatedAt}
      error={metadata.error?.message}
      onRefresh={metadata.refetch}
    >
      {metadata.data ? (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["Name", metadata.data.name],
            ["Symbol", metadata.data.symbol],
            ["Decimals", String(metadata.data.decimals)],
            [
              "Verification",
              metadata.data.isVerified === null
                ? "Unknown"
                : metadata.data.isVerified
                  ? "Verified"
                  : "Unverified",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </ApiHookCard>
  );
}

function PriorityFeeEstimatePreview() {
  const estimate = usePriorityFeeEstimate([], { cluster: "devnet" });

  return (
    <ApiHookCard
      title="Devnet priority fee samples"
      status={estimate.status}
      updatedAt={estimate.updatedAt}
      error={estimate.error?.message}
      onRefresh={estimate.refetch}
    >
      {estimate.data ? (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Low", estimate.data.low],
            ["Medium", estimate.data.medium],
            ["High", estimate.data.high],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </ApiHookCard>
  );
}

function PaymentQuotePreview() {
  const quote = usePaymentQuote({
    inputMint: MAINNET_USDC_MINT,
    outputMint: SOL_MINT,
    amount: "1000000",
    swapMode: "ExactIn",
    slippageBps: 50,
  });

  return (
    <ApiHookCard
      title="1 USDC to SOL quote"
      status={quote.status}
      updatedAt={quote.updatedAt}
      error={quote.error?.message}
      onRefresh={quote.refetch}
    >
      {quote.data ? (
        <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.025]">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-zinc-500 dark:text-zinc-400">Output atomics</dt>
            <dd className="font-mono font-semibold">{quote.data.outputAmount}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-zinc-500 dark:text-zinc-400">Price impact</dt>
            <dd className="font-semibold">{quote.data.priceImpactPct}%</dd>
          </div>
        </dl>
      ) : null}
    </ApiHookCard>
  );
}

function TransactionHistoryPreview() {
  const { publicKey } = useWallet();
  const history = useTransactionHistory(publicKey?.toBase58(), {
    cluster: "devnet",
    limit: 5,
  });

  if (!publicKey) {
    return (
      <div className="w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#111113]">
        <p className="text-sm font-semibold">Connect a devnet wallet</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Transaction history is read through the server RPC adapter.
        </p>
        <div className="mt-5 flex justify-center">
          <PreviewWalletButton />
        </div>
      </div>
    );
  }

  return (
    <ApiHookCard
      title="Recent devnet transactions"
      status={history.status}
      updatedAt={history.updatedAt}
      error={history.error?.message}
      onRefresh={history.refetch}
    >
      {history.data ? (
        history.data.items.length > 0 ? (
          <div className="space-y-2">
            {history.data.items.map((item) => (
              <div
                key={item.signature}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.025]"
              >
                <p className="truncate font-mono text-xs">{item.signature}</p>
                <p className="mt-1 text-xs capitalize text-zinc-500">
                  {item.status} · slot {item.slot}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No recent transactions found.</p>
        )
      ) : null}
    </ApiHookCard>
  );
}

export const hookPreviews: Record<string, ReactNode> = {
  "use-token-balance": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <UseTokenBalancePreview />
    </SolanaProvider>
  ),
  "use-token-safety": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <TokenSafetyDisclosurePreview />
    </div>
  ),
  "use-token-list": (
    <div className="flex min-w-0 w-full max-w-3xl items-center justify-center p-2 sm:p-4">
      <TokenDiscoverySafetyFlow initialQuery="USDC" />
    </div>
  ),
  "use-token-metadata": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <TokenMetadataPreview />
    </div>
  ),
  "use-priority-fee-estimate": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <PriorityFeeEstimatePreview />
    </div>
  ),
  "use-payment-quote": (
    <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
      <PaymentQuotePreview />
    </div>
  ),
  "use-payment-status": (
    <div className="flex min-w-0 w-full max-w-2xl items-center justify-center p-2 sm:p-4">
      <TransactionRecoveryFlow />
    </div>
  ),
  "use-transaction-history": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionHistoryPreview />
      </div>
    </SolanaProvider>
  ),
  "use-recipient-validation": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <SafeRecipientFieldPreview />
      </div>
    </SolanaProvider>
  ),
  "use-transaction-simulation": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionSimulationPreview />
      </div>
    </SolanaProvider>
  ),
  "use-smart-retry": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <SmartRetryPreview />
      </div>
    </SolanaProvider>
  ),
  "use-transaction-status": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <TransactionLifecyclePreview />
      </div>
    </SolanaProvider>
  ),
  "use-private-payment": (
    <div className="max-h-155 w-full overflow-auto rounded-xl">
      <SolanaProvider network={WalletAdapterNetwork.Devnet}>
        <PrivateTransfer />
      </SolanaProvider>
    </div>
  ),
  "use-optimistic-transaction": (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <div className="flex min-w-0 w-full max-w-130 items-center justify-center p-2 sm:p-4">
        <OptimisticTransactionPreview />
      </div>
    </SolanaProvider>
  ),
};
