"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { PublicKey, type Connection } from "@solana/web3.js";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useSmartRetry } from "../hooks/use-smart-retry";
import { useTransactionStatus } from "../hooks/use-transaction-status";

// ─── types ────────────────────────────────────────────────────────────────────

export type QuickSendStatus =
  | "idle"
  | "sending"
  | "confirming"
  | "confirmed"
  | "failed";

export type QuickSendFlowProps = {
  /** Display name for the sender wallet */
  senderName?: string;
  /** Sender wallet address shown in the route summary */
  sender?: string;
  /** Display name for the recipient (e.g. "alice.sol", "Bonk DAO") */
  recipientName?: string;
  /** Full recipient wallet address */
  recipient?: string;
  /** Token symbol label (default: "SOL") */
  tokenSymbol?: string;
  /** Optional spendable balance label shown with the connected account */
  availableBalance?: string;
  /** Preset quick-amount buttons */
  presets?: number[];
  /** Cluster for explorer links */
  cluster?: "mainnet-beta" | "devnet" | "testnet" | string;
  /** Network fee label shown in the receipt */
  networkFee?: string;
  /** Live Solana connection — optional. Without it the flow runs in demo mode */
  connection?: Connection | null;
  /**
   * Called to actually send the transaction. Receives the amount and recipient,
   * then resolves with the transaction signature string.
   */
  onSend?: (amount: number, recipient: string) => Promise<string>;
  /** Optional confirmation step. Use this to wait for your wallet/RPC flow */
  onConfirm?: (
    signature: string,
    amount: number,
    recipient: string,
  ) => Promise<unknown>;
  /**
   * Enables automatic retries for onSend. Only enable this when onSend is
   * idempotent or can safely determine that a previous broadcast did not land.
   */
  retrySend?: boolean;
  /** Called when the transaction is confirmed */
  onSuccess?: (signature: string, amount: number, recipient: string) => void;
  /** Called when send or confirmation fails */
  onError?: (error: Error) => void;
};

const demoSender = "4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw";
const demoRecipient = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg88R";
const registryBorder = "border-[#f4f4f4] dark:border-[#141414]";
const registryDivider = "divide-[#f4f4f4] dark:divide-[#141414]";
const registryInset =
  "bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] dark:bg-black";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function shortAddress(address: string) {
  if (address.length <= 11) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function formatTokenAmount(value: number, symbol: string) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol === "SOL" ? 6 : 2,
  })} ${symbol}`;
}

function sanitizeAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fraction] = cleaned.split(".");
  return fraction.length > 0 ? `${whole}.${fraction.join("").slice(0, 9)}` : whole;
}

function explorerUrl(signature: string, cluster: string) {
  return `https://solscan.io/tx/${signature}${
    cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`
  }`;
}

function isValidSolanaAddress(value: string) {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
}

function toError(value: unknown, fallback: string) {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);

  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(fallback);
  }
}

function formatWalletDebit(
  amount: number,
  tokenSymbol: string,
  networkFee: string,
) {
  const [feeValue, feeSymbol] = networkFee.trim().split(/\s+/, 2);
  const parsedFee = Number(feeValue);

  if (
    Number.isFinite(parsedFee) &&
    feeSymbol?.toUpperCase() === tokenSymbol.toUpperCase()
  ) {
    return formatTokenAmount(amount + parsedFee, tokenSymbol);
  }

  return `${formatTokenAmount(amount, tokenSymbol)} + ${networkFee}`;
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className={cx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white text-zinc-500 transition-colors duration-100 hover:bg-[#f4f4f4] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none dark:bg-neutral-950 dark:text-zinc-400 dark:hover:bg-[#141414] dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-50/25 dark:focus-visible:ring-offset-black",
        registryBorder,
      )}
    >
      {copied ? (
        <Check size={15} aria-hidden="true" />
      ) : (
        <Copy size={15} aria-hidden="true" />
      )}
    </button>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={cx(
          "w-2/3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300",
          strong && "font-semibold text-zinc-950 dark:text-zinc-50",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ConnectedAccount({
  name,
  address,
  balance,
}: {
  name: string;
  address: string;
  balance?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 rounded-xl border p-2.5",
        registryBorder,
        registryInset,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]"
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              From
            </span>
            {name}
          </span>
          <span
            className="block truncate font-mono text-xs text-zinc-500 dark:text-zinc-400"
            title={address}
          >
            {shortAddress(address)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {balance ? (
          <span className="hidden text-right sm:block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Available
            </span>
            <span className="block font-mono text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
              {balance}
            </span>
          </span>
        ) : null}
        <CopyButton value={address} label="Copy sender address" />
      </div>
    </div>
  );
}

export function QuickSendFlow({
  senderName = "Connected wallet",
  sender = demoSender,
  recipientName = "ux.sol",
  recipient = demoRecipient,
  tokenSymbol = "SOL",
  availableBalance,
  presets = [0.1, 0.5, 1, 5],
  cluster = "devnet",
  networkFee = "0.000005 SOL",
  connection = null,
  onSend,
  onConfirm,
  retrySend = false,
  onSuccess,
  onError,
}: QuickSendFlowProps) {
  const amountId = useId();
  const recipientId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const recipientRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);
  const settledSignatureRef = useRef<string | null>(null);
  const [amount, setAmount] = useState(String(presets[1] ?? 0.5));
  const [recipientInput, setRecipientInput] = useState(recipient);
  const [amountTouched, setAmountTouched] = useState(false);
  const [recipientTouched, setRecipientTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [flowStatus, setFlowStatus] = useState<QuickSendStatus>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const hasRecipient = isValidSolanaAddress(recipientInput);
  const displayBalance = availableBalance ?? (onSend ? undefined : "12.48 SOL");
  const amountError = !amount
    ? "Enter an amount."
    : !hasAmount
      ? "Enter an amount greater than 0."
      : null;
  const recipientError = !recipientInput
    ? "Enter a recipient address."
    : !hasRecipient
      ? "Enter a valid Solana address."
      : null;
  const showAmountError = Boolean(amountError && (amountTouched || submitAttempted));
  const showRecipientError = Boolean(
    recipientError && (recipientTouched || submitAttempted),
  );

  const explorerCluster =
    cluster === "mainnet-beta" || cluster === "devnet" || cluster === "testnet"
      ? cluster
      : "custom";

  const txStatus = useTransactionStatus({
    client: connection,
    signature,
    cluster: explorerCluster,
  });
  const {
    error: transactionError,
    explorerLink: transactionExplorerLink,
    retry: retryTransactionStatus,
    signature: trackedSignature,
    status: transactionStatus,
  } = txStatus;

  const sendRetryOptions = useMemo(
    () => ({
      maxAttempts: 3,
      baseDelayMs: 500,
      shouldRetry: (
        _error: unknown,
        _attempt: number,
        decision: { retryable: boolean },
      ) => retrySend && decision.retryable,
    }),
    [retrySend],
  );
  const confirmationRetryOptions = useMemo(
    () => ({ maxAttempts: 3, baseDelayMs: 750 }),
    [],
  );
  const sendRetry = useSmartRetry<string>(sendRetryOptions);
  const confirmationRetry = useSmartRetry<void>(confirmationRetryOptions);

  const completeTransfer = useCallback(
    (nextSignature: string, nextAmount: number, nextRecipient: string) => {
      if (settledSignatureRef.current === nextSignature) return;
      inFlightRef.current = false;
      settledSignatureRef.current = nextSignature;
      setFlowStatus("confirmed");
      setFlowError(null);
      onSuccess?.(nextSignature, nextAmount, nextRecipient);
    },
    [onSuccess],
  );

  const failTransfer = useCallback(
    (value: unknown, fallback = "Transaction confirmation failed.") => {
      const nextError = toError(value, fallback);
      inFlightRef.current = false;
      setFlowStatus("failed");
      setFlowError(nextError.message);
      onError?.(nextError);
    },
    [onError],
  );

  const handleSend = useCallback(async () => {
    if (inFlightRef.current) return;
    setSubmitAttempted(true);

    if (!hasRecipient) {
      recipientRef.current?.focus();
      return;
    }

    if (!hasAmount) {
      amountRef.current?.focus();
      return;
    }

    if (onSend && !onConfirm && !connection) {
      failTransfer(
        new Error(
          "Provide a Solana connection or onConfirm to verify this transfer.",
        ),
      );
      return;
    }

    inFlightRef.current = true;
    const resumeSignature = flowStatus === "failed" ? signature : null;
    setFlowError(null);
    setSignature(resumeSignature);
    setFlowStatus(resumeSignature ? "confirming" : "sending");

    try {
      let nextSignature = resumeSignature;

      if (!nextSignature) {
        if (onSend) {
          nextSignature = await sendRetry.execute(() =>
            onSend(numericAmount, recipientInput),
          );
        } else {
          await wait(900);
          nextSignature = `quicksend_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
        }

        setSignature(nextSignature);
      }
      setFlowStatus("confirming");

      if (!onSend) {
        await wait(800);
        completeTransfer(nextSignature, numericAmount, recipientInput);
        return;
      }

      if (onConfirm) {
        await confirmationRetry.execute(async () => {
          await onConfirm(nextSignature, numericAmount, recipientInput);
        });
        completeTransfer(nextSignature, numericAmount, recipientInput);
        return;
      }

      if (resumeSignature) retryTransactionStatus();
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err));
      const message = nextError.message.toLowerCase();

      if (message.includes("rejected") || message.includes("declined")) {
        inFlightRef.current = false;
        setFlowStatus("idle");
        setFlowError(null);
        return;
      }

      failTransfer(nextError);
    }
  }, [
    completeTransfer,
    connection,
    confirmationRetry,
    failTransfer,
    hasAmount,
    hasRecipient,
    flowStatus,
    numericAmount,
    onConfirm,
    onSend,
    recipientInput,
    sendRetry,
    signature,
    retryTransactionStatus,
  ]);

  useEffect(() => {
    if (
      !connection ||
      onConfirm ||
      flowStatus !== "confirming" ||
      !signature ||
      trackedSignature !== signature
    ) {
      return;
    }

    const settleTimer = window.setTimeout(() => {
      if (
        transactionStatus === "confirmed" ||
        transactionStatus === "finalized"
      ) {
        completeTransfer(signature, numericAmount, recipientInput);
        return;
      }

      if (
        transactionStatus === "failed" ||
        transactionStatus === "expired"
      ) {
        failTransfer(
          transactionError,
          transactionStatus === "expired"
            ? "Timed out waiting for transaction confirmation."
            : "Transaction failed on-chain.",
        );
      }
    }, 0);

    return () => window.clearTimeout(settleTimer);
  }, [
    completeTransfer,
    connection,
    failTransfer,
    flowStatus,
    numericAmount,
    onConfirm,
    recipientInput,
    signature,
    trackedSignature,
    transactionError,
    transactionStatus,
  ]);

  const clearFailedAttempt = useCallback(() => {
    if (flowStatus !== "failed") return;
    inFlightRef.current = false;
    settledSignatureRef.current = null;
    setFlowStatus("idle");
    setSignature(null);
    setFlowError(null);
  }, [flowStatus]);

  const handleNewSend = useCallback(() => {
    inFlightRef.current = false;
    settledSignatureRef.current = null;
    setAmount("");
    setAmountTouched(false);
    setRecipientTouched(false);
    setSubmitAttempted(false);
    setFlowStatus("idle");
    setSignature(null);
    setFlowError(null);
  }, []);

  const isBusy = flowStatus === "sending" || flowStatus === "confirming";

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const explorerLink = useMemo(() => {
    if (!signature) return null;
    return transactionExplorerLink ?? explorerUrl(signature, cluster);
  }, [signature, transactionExplorerLink, cluster]);

  const primaryAction = useMemo(() => {
    if (flowStatus === "sending") return "Waiting for wallet…";
    if (flowStatus === "confirming") return "Confirming transfer…";
    if (flowStatus === "failed") {
      return signature ? "Retry confirmation" : "Try send again";
    }
    return hasAmount
      ? `Send ${formatTokenAmount(numericAmount, tokenSymbol)}`
      : "Continue to wallet";
  }, [flowStatus, hasAmount, numericAmount, signature, tokenSymbol]);

  const networkLabel =
    cluster === "mainnet-beta"
      ? "Mainnet"
      : cluster.charAt(0).toUpperCase() + cluster.slice(1);
  const recipientLabel =
    recipientInput === recipient && recipientName
      ? recipientName
      : shortAddress(recipientInput);

  return (
    <section
      className={cx(
        "mx-auto w-full max-w-lg overflow-hidden rounded-2xl border bg-white text-zinc-950 shadow-sm dark:bg-neutral-950 dark:text-zinc-50 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
        registryBorder,
      )}
    >
      <header
        className={cx(
          "flex items-center justify-between gap-4 border-b px-4 py-3",
          registryBorder,
          registryInset,
        )}
      >
        <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Quick send
        </h1>
        <span
          className={cx(
            "shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold",
            cluster === "mainnet-beta"
              ? cx(
                  "bg-white text-zinc-600 dark:bg-neutral-950 dark:text-zinc-300",
                  registryBorder,
                )
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
          )}
        >
          {networkLabel}
        </span>
      </header>

      <form
        onSubmit={handleFormSubmit}
        className="space-y-3 p-4"
        noValidate
      >
        {flowStatus === "confirmed" ? (
          <div aria-live="polite">
            <div
              className={cx(
                "flex flex-col items-center border-b pb-4 text-center",
                registryBorder,
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_5px_rgba(16,185,129,0.12)]">
                <Check size={19} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Transfer confirmed
              </p>
              <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatTokenAmount(numericAmount, tokenSymbol)}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Sent to {recipientLabel}
              </p>
            </div>

            <dl className={cx("divide-y", registryDivider)}>
              <DetailRow label="From" value={shortAddress(sender)} />
              <DetailRow label="To" value={shortAddress(recipientInput)} />
              <DetailRow label="Network" value={networkLabel} />
              <DetailRow label="Network fee" value={networkFee} />
              <DetailRow
                label="Wallet debit"
                value={formatWalletDebit(
                  numericAmount,
                  tokenSymbol,
                  networkFee,
                )}
                strong
              />
            </dl>

            {signature ? (
              <div
                className={cx(
                  "mt-2 flex items-center justify-between gap-3 rounded-xl border p-3",
                  registryBorder,
                  registryInset,
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Signature
                  </span>
                  <span
                    className="block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300"
                    title={signature}
                  >
                    {shortAddress(signature)}
                  </span>
                </span>
                <CopyButton
                  value={signature}
                  label="Copy transaction signature"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <ConnectedAccount
              name={senderName}
              address={sender}
              balance={displayBalance}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={recipientId}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
                >
                  Recipient
                </label>
                {recipientInput === recipient && recipientName ? (
                  <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {recipientName}
                  </span>
                ) : null}
              </div>
              <input
                ref={recipientRef}
                id={recipientId}
                name="recipient"
                type="text"
                value={recipientInput}
                onChange={(event) => {
                  setRecipientInput(event.target.value.trim());
                  clearFailedAttempt();
                }}
                onBlur={() => setRecipientTouched(true)}
                placeholder="Solana wallet address"
                autoComplete="off"
                spellCheck={false}
                required
                disabled={isBusy}
                aria-invalid={showRecipientError ? "true" : undefined}
                aria-describedby={
                  showRecipientError ? `${recipientId}-error` : undefined
                }
                className={cx(
                  "min-h-11 w-full rounded-xl border px-3 font-mono text-sm text-zinc-900 transition-[border-color,box-shadow,background-color] duration-100 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus-visible:ring-zinc-50/25",
                  registryBorder,
                  registryInset,
                )}
              />
              {showRecipientError ? (
                <p
                  id={`${recipientId}-error`}
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  {recipientError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-3">
                <label
                  htmlFor={amountId}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
                >
                  Amount
                </label>
                {displayBalance ? (
                  <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400 sm:hidden">
                    {displayBalance} available
                  </span>
                ) : null}
              </div>
              <div
                className={cx(
                  "flex min-h-16 items-center rounded-xl border px-3 transition-[border-color,box-shadow,background-color] duration-100 focus-within:ring-2 focus-within:ring-zinc-950/20 motion-reduce:transition-none dark:focus-within:ring-zinc-50/25",
                  registryBorder,
                  registryInset,
                )}
              >
                <input
                  ref={amountRef}
                  id={amountId}
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(event) => {
                    setAmount(sanitizeAmountInput(event.target.value));
                    clearFailedAttempt();
                  }}
                  onBlur={() => setAmountTouched(true)}
                  aria-invalid={showAmountError ? "true" : undefined}
                  aria-describedby={
                    showAmountError ? `${amountId}-error` : undefined
                  }
                  placeholder="0.00"
                  required
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent font-mono text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 placeholder:text-zinc-300 focus-visible:outline-none disabled:cursor-not-allowed dark:text-zinc-50 dark:placeholder:text-zinc-700 sm:text-4xl"
                />
                <span
                  className={cx(
                    "rounded-lg border bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-600 dark:bg-neutral-950 dark:text-zinc-300",
                    registryBorder,
                  )}
                >
                  {tokenSymbol}
                </span>
              </div>
              {showAmountError ? (
                <p
                  id={`${amountId}-error`}
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  {amountError}
                </p>
              ) : null}
              <div className="grid grid-cols-4 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      setAmountTouched(true);
                      clearFailedAttempt();
                    }}
                    disabled={isBusy}
                    className={cx(
                      "min-h-10 rounded-xl border px-2 font-mono text-xs font-semibold tabular-nums transition-[background-color,color,border-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none dark:focus-visible:ring-zinc-50/25 dark:focus-visible:ring-offset-neutral-950",
                      numericAmount === preset
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : cx(
                            "text-zinc-600 hover:bg-[#f4f4f4] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#141414] dark:hover:text-zinc-100",
                            registryBorder,
                            registryInset,
                          ),
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <dl
              className={cx(
                "grid grid-cols-2 divide-x rounded-xl border",
                registryBorder,
                registryDivider,
                registryInset,
              )}
            >
              <div className="px-3 py-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Network fee
                </dt>
                <dd className="mt-1 font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                  {networkFee}
                </dd>
              </div>
              <div className="px-3 py-2.5 text-right">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Wallet debit
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {hasAmount
                    ? formatWalletDebit(
                        numericAmount,
                        tokenSymbol,
                        networkFee,
                      )
                    : `- ${tokenSymbol}`}
                </dd>
              </div>
            </dl>
          </>
        )}

        {flowStatus === "confirmed" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {explorerLink ? (
              <a
                href={explorerLink}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold text-zinc-700 transition-colors duration-100 hover:bg-[#f4f4f4] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none dark:text-zinc-300 dark:hover:bg-[#141414] dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-50/25 dark:focus-visible:ring-offset-black",
                  registryBorder,
                  registryInset,
                )}
              >
                View on Solscan
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleNewSend}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,color,opacity,transform] duration-100 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-50/25 dark:focus-visible:ring-offset-neutral-950"
            >
              Send another
            </button>
          </div>
        ) : (
          <>
            {isBusy || flowError ? (
              <div aria-live="polite">
                {isBusy ? (
                  <div
                    className={cx(
                      "rounded-xl border px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-300",
                      registryBorder,
                      registryInset,
                    )}
                  >
                    <span className="font-semibold">
                      {flowStatus === "sending"
                        ? "Approve in your wallet."
                        : `Confirming on ${networkLabel}.`}
                    </span>
                    {flowStatus === "sending" && sendRetry.attempt > 1
                      ? ` Retry ${sendRetry.attempt} of 3.`
                      : ""}
                    {flowStatus === "confirming" &&
                    onConfirm &&
                    confirmationRetry.attempt > 1
                      ? ` Check ${confirmationRetry.attempt} of 3.`
                      : ""}
                  </div>
                ) : null}
                {flowError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/8 dark:text-red-300"
                  >
                    <span className="font-semibold">
                      {signature
                        ? "Confirmation check failed."
                        : "Transfer failed."}
                    </span>{" "}
                    {flowError}{" "}
                    {signature
                      ? "Retrying checks the same transaction."
                      : "Check wallet activity before trying again."}
                    {signature && explorerLink ? (
                      <a
                        href={explorerLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                      >
                        View transaction
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isBusy}
              aria-busy={isBusy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,color,opacity,transform] duration-100 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-50/25 dark:focus-visible:ring-offset-neutral-950"
            >
              {isBusy ? (
                <Loader2
                  size={16}
                  className="motion-safe:animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {primaryAction}
            </button>
          </>
        )}
      </form>
    </section>
  );
}

export default QuickSendFlow;
