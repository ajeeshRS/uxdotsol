"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Buffer } from "buffer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMintDecimals,
} from "@/lib/uxdotsol/token-program";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { ConnectWalletBtn } from "./connect-wallet-btn";

export type SolanaPayStatus =
  | "ready"
  | "processing"
  | "confirmed"
  | "expired";

export type SolanaPayCheckoutProps = {
  recipient: string;
  amount: number;
  splToken?: string;
  reference?: string | string[];
  merchantName?: string;
  description?: string;
  message?: string;
  memo?: string;
  orderId?: string;
  tokenSymbol?: string;
  network?: "mainnet" | "devnet" | "testnet";
  status?: SolanaPayStatus;
  walletLaunchUrl?: string;
  className?: string;
  onOpenWallet?: (paymentUrl: string) => void;
  onCopy?: (paymentUrl: string) => void;
  onTransactionSubmitted?: (signature: string) => void;
  onPaymentError?: (error: Error) => void;
};

type PaymentRequestResult =
  | { paymentUrl: string; error: null }
  | { paymentUrl: null; error: string };

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 9,
});
const memoProgramId = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

function shortenAddress(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function createPaymentRequest({
  recipient,
  amount,
  splToken,
  reference,
  merchantName,
  message,
  memo,
}: Pick<
  SolanaPayCheckoutProps,
  | "recipient"
  | "amount"
  | "splToken"
  | "reference"
  | "merchantName"
  | "message"
  | "memo"
>): PaymentRequestResult {
  try {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a payment amount greater than zero.");
    }

    const recipientAddress = new PublicKey(recipient).toBase58();
    const formattedAmount = amount.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
    if (Number(formattedAmount) !== amount) {
      throw new Error("The payment amount cannot be encoded precisely.");
    }

    const params = new URLSearchParams({ amount: formattedAmount });
    if (splToken) params.set("spl-token", new PublicKey(splToken).toBase58());
    const references = Array.isArray(reference)
      ? reference
      : reference
        ? [reference]
        : [];
    for (const value of references) {
      params.append("reference", new PublicKey(value).toBase58());
    }
    if (merchantName) params.set("label", merchantName);
    if (message) params.set("message", message);
    if (memo) params.set("memo", memo);

    return {
      paymentUrl: `solana:${recipientAddress}?${params.toString()}`,
      error: null,
    };
  } catch (cause) {
    return {
      paymentUrl: null,
      error:
        cause instanceof Error
          ? cause.message
          : "The payment request is invalid.",
    };
  }
}

function toAtomicUnits(amount: number, decimals: number) {
  const atomicAmount = Math.round(amount * 10 ** decimals);
  if (!Number.isSafeInteger(atomicAmount) || atomicAmount <= 0) {
    throw new Error("The payment amount cannot be represented safely.");
  }
  return BigInt(atomicAmount);
}

function addReferenceKeys(
  instruction: TransactionInstruction,
  reference?: string | string[],
) {
  const references = Array.isArray(reference)
    ? reference
    : reference
      ? [reference]
      : [];

  instruction.keys.push(
    ...references.map((value) => ({
      pubkey: new PublicKey(value),
      isSigner: false,
      isWritable: false,
    })),
  );
}

async function createWalletPaymentTransaction({
  connection,
  payer,
  recipient,
  amount,
  splToken,
  reference,
  memo,
}: {
  connection: Connection;
  payer: PublicKey;
  recipient: string;
  amount: number;
  splToken?: string;
  reference?: string | string[];
  memo?: string;
}) {
  const recipientAddress = new PublicKey(recipient);
  const transaction = new Transaction();
  let transferInstruction: TransactionInstruction;

  if (splToken) {
    const mintAddress = new PublicKey(splToken);
    const mintAccount = await connection.getAccountInfo(mintAddress, "confirmed");
    if (!mintAccount) throw new Error("The selected token mint was not found.");

    const tokenProgramId = mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;
    if (
      !mintAccount.owner.equals(TOKEN_PROGRAM_ID) &&
      !mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)
    ) {
      throw new Error("The selected address is not an SPL token mint.");
    }

    const decimals = await getMintDecimals(
      connection,
      mintAddress,
      tokenProgramId,
    );
    const payerTokenAccount = getAssociatedTokenAddress(
      mintAddress,
      payer,
      tokenProgramId,
    );
    const recipientTokenAccount = getAssociatedTokenAddress(
      mintAddress,
      recipientAddress,
      tokenProgramId,
    );
    const [payerAccount, recipientAccount] = await Promise.all([
      connection.getAccountInfo(payerTokenAccount, "confirmed"),
      connection.getAccountInfo(recipientTokenAccount, "confirmed"),
    ]);

    if (!payerAccount) {
      throw new Error(`Your wallet does not have a ${splToken} token account.`);
    }
    if (!recipientAccount) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          recipientTokenAccount,
          recipientAddress,
          mintAddress,
          tokenProgramId,
        ),
      );
    }

    transferInstruction = createTransferCheckedInstruction(
      payerTokenAccount,
      mintAddress,
      recipientTokenAccount,
      payer,
      toAtomicUnits(amount, decimals),
      decimals,
      tokenProgramId,
    );
  } else {
    transferInstruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipientAddress,
      lamports: toAtomicUnits(amount, Math.log10(LAMPORTS_PER_SOL)),
    });
  }

  addReferenceKeys(transferInstruction, reference);
  if (memo) {
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from(memo, "utf8"),
      }),
    );
  }
  transaction.add(transferInstruction);
  return transaction;
}

function SolanaMark({
  className = "",
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "inverse";
}) {
  return (
    <img
      src="https://solana.com/src/img/branding/solanaLogoMark.svg"
      alt=""
      width={28}
      height={28}
      className={`${tone === "inverse" ? "brightness-0 invert dark:invert-0" : ""} ${className}`}
    />
  );
}

function StatusIcon({ status }: { status: SolanaPayStatus }) {
  if (status === "confirmed") {
    return <CheckCircle2 size={17} strokeWidth={2.25} aria-hidden="true" />;
  }

  if (status === "expired") {
    return <TriangleAlert size={17} strokeWidth={2.25} aria-hidden="true" />;
  }

  if (status === "processing") {
    return (
      <LoaderCircle
        size={17}
        strokeWidth={2.25}
        className="motion-safe:animate-spin"
        aria-hidden="true"
      />
    );
  }

  return <Clock3 size={17} strokeWidth={2.25} aria-hidden="true" />;
}

const statusContent: Record<
  SolanaPayStatus,
  { title: string; description: string; className: string }
> = {
  ready: {
    title: "Ready for payment",
    description: "Scan the QR code or open this request in your wallet.",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-white/12 dark:bg-white/6 dark:text-zinc-200",
  },
  processing: {
    title: "Awaiting confirmation",
    description: "Confirm in your wallet while the merchant verifies payment.",
    className:
      "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-white/15 dark:bg-white/8 dark:text-zinc-100",
  },
  confirmed: {
    title: "Payment confirmed",
    description: "The merchant has verified this payment onchain.",
    className:
      "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950",
  },
  expired: {
    title: "Payment request expired",
    description: "Create a new request before attempting payment.",
    className:
      "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300",
  },
};

export function SolanaPayCheckout({
  recipient,
  amount,
  splToken,
  reference,
  merchantName = "Solana Pay",
  description = "Secure wallet checkout",
  message,
  memo,
  orderId,
  tokenSymbol,
  network = "mainnet",
  status = "ready",
  walletLaunchUrl,
  className = "",
  onOpenWallet,
  onCopy,
  onTransactionSubmitted,
  onPaymentError,
}: SolanaPayCheckoutProps) {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const titleId = useId();
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "submitted"
  >("idle");
  const [walletError, setWalletError] = useState<string | null>(null);
  const paymentRequest = createPaymentRequest({
    recipient,
    amount,
    splToken,
    reference,
    merchantName,
    message,
    memo,
  });
  const paymentUrl = paymentRequest.paymentUrl;
  const symbol = tokenSymbol || (splToken ? "Token" : "SOL");
  const effectiveStatus =
    status === "ready" && submissionStatus === "submitted"
      ? "processing"
      : status;
  const statusDetails = statusContent[effectiveStatus];
  const paymentDisabled = status !== "ready" || submissionStatus !== "idle";

  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    if (!paymentUrl) return;

    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      onCopy?.(paymentUrl);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleOpenWallet() {
    if (!paymentUrl || paymentDisabled) return;
    onOpenWallet?.(paymentUrl);
    window.location.assign(walletLaunchUrl || paymentUrl);
  }

  async function handlePayWithWallet() {
    if (!publicKey || !paymentUrl || paymentDisabled) return;

    setWalletError(null);
    setSubmissionStatus("submitting");

    try {
      const transaction = await createWalletPaymentTransaction({
        connection,
        payer: publicKey,
        recipient,
        amount,
        splToken,
        reference,
        memo,
      });
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
      });
      setSubmissionStatus("submitted");
      onTransactionSubmitted?.(signature);
    } catch (cause) {
      const error =
        cause instanceof Error ? cause : new Error("Wallet payment failed.");
      setSubmissionStatus("idle");
      setWalletError(error.message);
      onPaymentError?.(error);
    }
  }

  return (
    <section
      className={`w-full max-w-105 rounded-[24px] border border-zinc-200 bg-white p-6 text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7 ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 shadow-[0_8px_18px_rgba(0,0,0,0.16)] dark:bg-zinc-100">
            <SolanaMark tone="inverse" className="size-6" />
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-base font-semibold tracking-[-0.02em]"
            >
              {merchantName}
            </h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
          {network}
        </span>
      </div>

      <div className="mt-7 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Amount due
        </p>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-[38px] font-bold leading-none tracking-[-0.045em] tabular-nums">
            {amountFormatter.format(amount)}
          </span>
          <span className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
            {symbol}
          </span>
        </div>
        {orderId ? (
          <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Order {orderId}
          </p>
        ) : null}
      </div>

      {paymentRequest.error ? (
        <div
          className="mt-7 rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm leading-5 text-zinc-700 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300"
          role="alert"
        >
          {paymentRequest.error}
        </div>
      ) : (
        <div className="mt-7">
          <div className="mx-auto flex w-full max-w-72 items-center justify-center rounded-[24px] border border-zinc-200 bg-zinc-50 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.07)] dark:border-white/15 dark:bg-white sm:p-4">
            <QRCodeSVG
              value={paymentRequest.paymentUrl ?? ""}
              size={256}
              level="Q"
              marginSize={4}
              bgColor="#FFFFFF"
              fgColor="#18181B"
              title={`Solana Pay QR code for ${amountFormatter.format(amount)} ${symbol}`}
              className="block aspect-square h-auto w-full max-w-64 shrink-0 rounded-xl"
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Smartphone size={14} aria-hidden="true" />
            Scan with a Solana Pay wallet
          </div>
          <button
            type="button"
            onClick={handleOpenWallet}
            disabled={paymentDisabled}
            className="mx-auto mt-2 flex touch-manipulation items-center gap-1.5 text-xs font-semibold text-zinc-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 sm:hidden"
          >
            Open on this device
            <ExternalLink size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <dl className="mt-6 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 dark:divide-white/8 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Recipient</dt>
          <dd
            className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200"
            title={recipient}
            translate="no"
          >
            {shortenAddress(recipient)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Request</dt>
          <dd className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            <ShieldCheck size={14} className="text-zinc-600 dark:text-zinc-300" aria-hidden="true" />
            Solana Pay
          </dd>
        </div>
      </dl>

      <div
        className={`mt-4 flex gap-3 rounded-2xl border px-4 py-3 ${statusDetails.className}`}
        role="status"
        aria-live="polite"
      >
        <span className="mt-0.5 shrink-0">
          <StatusIcon status={effectiveStatus} />
        </span>
        <div>
          <p className="text-sm font-semibold">{statusDetails.title}</p>
          <p className="mt-0.5 text-xs leading-4 opacity-80">
            {statusDetails.description}
          </p>
        </div>
      </div>

      {walletError ? (
        <p
          className="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs leading-5 text-zinc-700 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300"
          role="alert"
        >
          {walletError}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
        {connected || status !== "ready" ? (
          <button
            type="button"
            onClick={handlePayWithWallet}
            disabled={paymentDisabled || !paymentUrl}
            className="flex min-h-14 touch-manipulation items-center justify-center gap-2.5 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-[background-color,opacity,transform,box-shadow] duration-150 hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#111113]"
          >
            {submissionStatus === "submitting" ? (
              <LoaderCircle
                size={17}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : status === "confirmed" ? (
              <Check size={17} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <SolanaMark tone="inverse" className="size-4" />
            )}
            {submissionStatus === "submitting"
              ? "Approve in wallet…"
              : status === "confirmed"
                ? "Payment complete"
                : "Pay with wallet"}
          </button>
        ) : (
          <ConnectWalletBtn
            showMenuToggle={false}
            className="w-full [&>button]:min-h-14 [&>button]:w-full [&>button]:justify-center [&>button]:rounded-2xl [&>button]:border-0 [&>button]:bg-zinc-950 [&>button]:px-5 [&>button]:text-sm [&>button]:text-white [&>button]:shadow-[0_10px_24px_rgba(0,0,0,0.16)] dark:[&>button]:bg-zinc-100 dark:[&>button]:text-zinc-950"
          />
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!paymentUrl}
          aria-label={copied ? "Payment link copied" : "Copy payment link"}
          title={copied ? "Copied" : "Copy payment link"}
          className={`flex size-14 touch-manipulation items-center justify-center rounded-2xl border transition-[background-color,border-color,color,opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-white/25 ${
            copied
              ? "scale-105 border-zinc-400 bg-zinc-100 text-zinc-950 dark:border-white/30 dark:bg-white/12 dark:text-white"
              : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 active:scale-90 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/8 dark:hover:text-white"
          }`}
        >
          <span className="relative size-4" aria-hidden="true">
            <Copy
              size={16}
              className={`absolute inset-0 transition-[opacity,transform] duration-200 ${
                copied
                  ? "rotate-12 scale-50 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }`}
            />
            <Check
              size={16}
              strokeWidth={2.5}
              className={`absolute inset-0 transition-[opacity,transform] duration-200 [&>path]:[stroke-dasharray:24] [&>path]:transition-[stroke-dashoffset] [&>path]:duration-300 ${
                copied
                  ? "scale-100 opacity-100 [&>path]:[stroke-dashoffset:0]"
                  : "scale-50 opacity-0 [&>path]:[stroke-dashoffset:-24]"
              }`}
            />
          </span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Payment link copied" : ""}
        </span>
      </div>
    </section>
  );
}
