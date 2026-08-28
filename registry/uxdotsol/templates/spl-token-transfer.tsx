"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMintDecimals,
} from "@/lib/uxdotsol/token-program";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { ConnectWalletBtn } from "@/components/uxdotsol/components/connect-wallet-btn";
import { SafeRecipientField } from "@/components/uxdotsol/components/safe-recipient-field";
import { TransactionLifecycle } from "@/components/uxdotsol/components/transaction-lifecycle";
import { useTokenMetadata } from "@/hooks/uxdotsol/use-token-metadata";

export type SplTokenTransferTemplateProps = {
  defaultMint?: string;
  defaultRecipient?: string;
  defaultAmount?: string;
  cluster?: "mainnet-beta" | "devnet" | "testnet";
  className?: string;
};

function toAtomicAmount(value: string, decimals: number) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Enter a valid token amount.");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new Error(`This token supports ${decimals} decimal places.`);
  const atomic = BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
  if (atomic <= 0n) throw new Error("Amount must be greater than zero.");
  return atomic;
}

export function SplTokenTransferTemplate({
  defaultMint = "",
  defaultRecipient = "",
  defaultAmount = "",
  cluster = "mainnet-beta",
  className = "",
}: SplTokenTransferTemplateProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [mint, setMint] = useState(defaultMint);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [amount, setAmount] = useState(defaultAmount);
  const [signature, setSignature] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "awaiting-wallet" | "failed">("idle");
  const [error, setError] = useState<Error | null>(null);
  const metadata = useTokenMetadata(mint);

  async function submit() {
    if (!publicKey) return;
    setError(null);
    setSignature(null);
    setPhase("preparing");

    try {
      const mintKey = new PublicKey(mint);
      const recipientKey = new PublicKey(recipient);
      const decimals = await getMintDecimals(connection, mintKey, TOKEN_PROGRAM_ID);
      const atomicAmount = toAtomicAmount(amount, decimals);
      const source = getAssociatedTokenAddress(mintKey, publicKey, TOKEN_PROGRAM_ID);
      const destination = getAssociatedTokenAddress(mintKey, recipientKey, TOKEN_PROGRAM_ID);
      const [sourceInfo, destinationInfo, latestBlockhash] = await Promise.all([
        connection.getAccountInfo(source, "confirmed"),
        connection.getAccountInfo(destination, "confirmed"),
        connection.getLatestBlockhash("confirmed"),
      ]);
      if (!sourceInfo) throw new Error("The connected wallet has no token account for this mint.");

      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      if (!destinationInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            destination,
            recipientKey,
            mintKey,
            TOKEN_PROGRAM_ID,
          ),
        );
      }
      transaction.add(
        createTransferCheckedInstruction(
          source,
          mintKey,
          destination,
          publicKey,
          atomicAmount,
          decimals,
          TOKEN_PROGRAM_ID,
        ),
      );
      setPhase("awaiting-wallet");
      const nextSignature = await sendTransaction(transaction, connection, { skipPreflight: false });
      setSignature(nextSignature);
      setPhase("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Token transfer failed."));
      setPhase("failed");
    }
  }

  return (
    <div className={`grid w-full max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px] ${className}`}>
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"><Send size={19} aria-hidden="true" /></span>
            <div className="min-w-0"><h1 className="text-base font-semibold tracking-[-0.02em]">SPL token transfer</h1><p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">Validate the mint and recipient before requesting a wallet signature.</p></div>
          </div>
          <ConnectWalletBtn className="shrink-0" showMenuToggle={false} />
        </div>

        <div className="mt-6 space-y-4">
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Token mint</span><input value={mint} onChange={(event) => setMint(event.currentTarget.value.trim())} placeholder="SPL token mint" className="mt-2 min-h-14 w-full rounded-2xl border border-zinc-200 bg-white px-4 font-mono text-sm outline-none focus:ring-2 dark:border-white/12 dark:bg-[#19191B]" /></label>
          {metadata.data ? <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-white/10 dark:bg-white/[0.025]">{metadata.data.name} · {metadata.data.symbol} · {metadata.data.decimals} decimals</p> : metadata.error ? <p className="text-xs text-red-600 dark:text-red-400">{metadata.error.message}</p> : null}
          <SafeRecipientField value={recipient} onValueChange={setRecipient} connection={connection} sender={publicKey} />
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Amount</span><input value={amount} onChange={(event) => setAmount(event.currentTarget.value)} inputMode="decimal" placeholder="0.00" className="mt-2 min-h-14 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-lg font-semibold outline-none focus:ring-2 dark:border-white/12 dark:bg-[#19191B]" /></label>
        </div>

        <button type="button" onClick={() => void submit()} disabled={!publicKey || !mint || !recipient || !amount || phase === "preparing" || phase === "awaiting-wallet"} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
          {phase === "preparing" || phase === "awaiting-wallet" ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
          {phase === "preparing" ? "Preparing transfer…" : phase === "awaiting-wallet" ? "Approve in wallet…" : "Review and send"}
        </button>
      </section>

      <TransactionLifecycle signature={signature} client={connection} cluster={cluster} submissionState={phase === "awaiting-wallet" ? "awaiting-wallet" : phase === "failed" ? "failed" : "idle"} submissionError={error} onRetry={() => void submit()} />
    </div>
  );
}

export default SplTokenTransferTemplate;
