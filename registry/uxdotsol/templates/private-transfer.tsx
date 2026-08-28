"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  usePrivatePayment,
  type PrivatePaymentTxResponse,
} from "@/hooks/uxdotsol/use-private-payment";
import { ConnectWalletBtn } from "@/components/uxdotsol/components/connect-wallet-btn";
import { SafeRecipientField } from "@/components/uxdotsol/components/safe-recipient-field";
import { TransactionReceipt } from "@/components/uxdotsol/components/transaction-receipt";

const DEVNET_RPC = "https://api.devnet.solana.com";
const connection = new Connection(DEVNET_RPC, "confirmed");
// Circle's devnet USDC mint
const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_DECIMALS = 6;

type WalletTransaction = Transaction | VersionedTransaction;

function decodeTransaction(
  payment: PrivatePaymentTxResponse,
): WalletTransaction {
  const bytes = Uint8Array.from(atob(payment.transactionBase64), (character) =>
    character.charCodeAt(0),
  );

  if (payment.version === "v0") {
    return VersionedTransaction.deserialize(bytes);
  }

  return Transaction.from(bytes);
}

function toUsdcAtomics(value: string) {
  const maxDecimals = USDC_DECIMALS;
  const pattern = new RegExp(`^\\d+(?:\\.\\d{1,${maxDecimals}})?$`);
  if (!pattern.test(value)) return null;

  const [whole, fraction = ""] = value.split(".");
  const atomics =
    BigInt(whole) * BigInt(10 ** maxDecimals) +
    BigInt(fraction.padEnd(maxDecimals, "0"));

  if (atomics < 1n || atomics > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(atomics);
}

export default function PrivateTransfer() {
  const payments = usePrivatePayment({ cluster: "devnet" });
  const { publicKey, signTransaction } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [confirmedDest, setConfirmedDest] = useState<string | null>(null);
  const [confirmedSignature, setConfirmedSignature] = useState<string | null>(
    null,
  );
  const [confirmedAmount, setConfirmedAmount] = useState<string | null>(null);

  /** Signs, submits, and confirms a transaction built by the API. */
  async function signAndConfirm(payment: PrivatePaymentTxResponse) {
    if (payment.sendTo !== "base") {
      throw new Error("This payment must be submitted to an ephemeral RPC.");
    }
    const tx = decodeTransaction(payment);
    const signed = await signTransaction!(tx);
    const sig = await connection.sendRawTransaction(await signed.serialize(), {
      maxRetries: 3,
      skipPreflight: false,
    });
    const confirmation =
      payment.recentBlockhash && payment.lastValidBlockHeight
        ? await connection.confirmTransaction(
            {
              signature: sig,
              blockhash:
                payment.recentBlockhash as import("@solana/web3.js").Blockhash,
              lastValidBlockHeight: payment.lastValidBlockHeight,
            },
            "confirmed",
          )
        : await connection.confirmTransaction(sig, "confirmed");
    if (confirmation.value.err) {
      throw new Error("Transaction failed during confirmation.");
    }
    return sig;
  }

  async function sendPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setConfirmedDest(null);
    setConfirmedSignature(null);

    const atomics = toUsdcAtomics(amount);

    if (!signTransaction || !walletAddress) {
      setMessage("Connect your wallet first.");
      return;
    }

    try {
      new PublicKey(destination);
    } catch {
      setMessage("Enter a valid recipient address.");
      return;
    }

    if (atomics === null) {
      setMessage("Enter a valid USDC amount with up to 6 decimal places.");
      return;
    }

    setIsSending(true);

    try {
      // Phase 1 — initialize the private-payment mint/vault on-chain only if
      // not already set up. initializeMint is NOT idempotent on-chain: calling
      // it when the transfer queue already exists causes an IllegalOwner error.
      setMessage("Checking accounts…");
      const mintStatus = await payments.isMintInitialized({
        mint: USDC_MINT,
        cluster: "devnet",
      });

      if (!mintStatus.initialized) {
        setMessage("Setting up accounts…");
        const initTx = await payments.initializeMint({
          payer: walletAddress,
          mint: USDC_MINT,
          cluster: "devnet",
        });
        await signAndConfirm(initTx);
      }

      // Phase 2 — transfer (no init flags; accounts are already on-chain).
      setMessage("Sending…");
      const payment = await payments.transfer({
        from: walletAddress,
        to: destination,
        mint: USDC_MINT,
        amount: atomics,
        visibility: "private",
        fromBalance: "base",
        toBalance: "base",
        initIfMissing: false,
        initAtasIfMissing: false,
        initVaultIfMissing: false,
        cluster: "devnet",
      });

      const signature = await signAndConfirm(payment);

      setIsSuccess(true);
      setConfirmedDest(destination);
      setConfirmedSignature(signature);
      setConfirmedAmount(amount);
      setMessage("Private USDC payment confirmed on devnet.");
      setAmount("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Private payment failed.",
      );
    } finally {
      setIsSending(false);
    }
  }

  const busy = isSending || payments.isLoading;

  return (
    <div className="min-h-screen w-screen bg-neutral-950 text-neutral-50">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <span className="text-sm font-semibold tracking-tight">
            Private Pay
          </span>
          <ConnectWalletBtn showMenuToggle={false} />
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center px-5 py-12">
        {confirmedSignature && confirmedDest && confirmedAmount ? (
          <TransactionReceipt
            receipt={{
              signature: confirmedSignature,
              status: "confirmed",
              network: { cluster: "devnet" },
              amount: { value: confirmedAmount, symbol: "USDC" },
              sender: { label: "Connected wallet", address: walletAddress },
              recipient: { label: "Recipient", address: confirmedDest },
            }}
            onDone={() => {
              setConfirmedSignature(null);
              setConfirmedDest(null);
              setConfirmedAmount(null);
              setIsSuccess(false);
              setMessage("");
            }}
          />
        ) : (
          <section className="w-full max-w-105 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4.5 py-4 dark:border-white/6 dark:bg-[#17171a]">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Send private USDC
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:border-amber-400/30 dark:bg-amber-400/8 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Devnet
              </span>
            </div>
          </div>

          <form onSubmit={sendPayment} className="space-y-4 p-4.5">
            <SafeRecipientField
              value={destination}
              onValueChange={setDestination}
              connection={connection}
              sender={publicKey}
              name="destination"
            />

            <div className="space-y-1.5">
              <label
                htmlFor="amount"
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
              >
                Amount
              </label>
              <div className="flex min-h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 transition-colors focus-within:ring-2 focus-within:ring-zinc-950/10 dark:border-white/8 dark:bg-white/3 dark:focus-within:ring-zinc-50/15">
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  autoComplete="off"
                  required
                  className="min-h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
                <span className="mr-2.5 rounded-lg bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
                  USDC
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!walletAddress || !destination || !amount || busy}
              aria-busy={busy}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.25 text-[13.5px] font-semibold tracking-tight text-white shadow-sm transition-[background-color,color,opacity,transform,box-shadow] duration-150 hover:opacity-80 active:scale-[0.98] active:opacity-100 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:opacity-100 dark:bg-zinc-100 dark:text-zinc-900 dark:disabled:bg-white/10 dark:disabled:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
            >
              {busy ? "Sending privately…" : "Send privately"}
            </button>

            {message ? (
              <div className="space-y-2">
                <p
                  role={isSuccess ? "status" : "alert"}
                  className={`rounded-xl px-3 py-2 text-xs font-medium ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-red-50 text-red-500 dark:bg-red-500/8 dark:text-red-400"
                  }`}
                >
                  {message}
                </p>
                {isSuccess && confirmedDest ? (
                  <a
                    href={`https://solscan.io/account/${confirmedDest}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[12.5px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/8 dark:bg-white/3 dark:text-zinc-400 dark:hover:border-white/12 dark:hover:bg-white/6 dark:hover:text-zinc-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View recipient on Solscan
                  </a>
                ) : null}
              </div>
            ) : null}
          </form>
          </section>
        )}
      </main>
    </div>
  );
}
