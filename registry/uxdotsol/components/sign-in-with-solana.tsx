"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import {
  createSignInMessage,
  type SolanaSignInInputWithRequiredFields,
} from "@solana/wallet-standard-util";
import { BadgeCheck, Check, Copy, LoaderCircle, LogOut } from "lucide-react";

type AuthSession = {
  address: string;
  expiresAt: string;
};

type AuthResponse = {
  authenticated: boolean;
  session?: AuthSession;
  error?: string;
};

type ClusterValue = "mainnet-beta" | "devnet" | "testnet";

type BalanceResponse = {
  balance?: string;
  error?: string;
};

type BalanceState = {
  key: string;
  value: string | null;
  error: string | null;
};

type SerializedSignInOutput = {
  account: {
    address: string;
    publicKey: number[];
    chains: readonly string[];
    features: readonly string[];
  };
  signedMessage: number[];
  signature: number[];
  signatureType?: string;
};

export type SignInWithSolanaProps = {
  endpoint?: string;
  accountEndpoint?: string;
  cluster?: ClusterValue;
  className?: string;
  walletLabel?: string;
  networkLabel?: string;
  balance?: string;
  fiatValue?: string;
  onSuccess?: (session: AuthSession) => void;
  onError?: (error: Error) => void;
};

function SolanaMark({
  className = "",
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "adaptive" | "inverse";
}) {
  return (
    <img
      src="https://solana.com/src/img/branding/solanaLogoMark.svg"
      alt=""
      width={32}
      height={32}
      className={`${
        tone === "adaptive"
          ? "brightness-0 dark:invert"
          : tone === "inverse"
            ? "brightness-0 invert dark:invert-0"
            : ""
      } ${className}`}
    />
  );
}

function WalletAvatar({
  icon,
  label,
}: {
  icon?: string;
  label: string;
}) {
  if (icon) {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-950/5 dark:bg-white/8 dark:ring-white/10">
        <img src={icon} alt={`${label} wallet`} width={44} height={44} />
      </span>
    );
  }

  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-950/5 dark:bg-white/8 dark:ring-white/10"
    >
      <SolanaMark tone="adaptive" className="size-6" />
    </div>
  );
}

function serializeOutput(output: SolanaSignInOutput): SerializedSignInOutput {
  return {
    account: {
      address: output.account.address,
      publicKey: Array.from(output.account.publicKey),
      chains: output.account.chains,
      features: output.account.features,
    },
    signedMessage: Array.from(output.signedMessage),
    signature: Array.from(output.signature),
    signatureType: output.signatureType,
  };
}

async function readJson(response: Response): Promise<AuthResponse> {
  const body = (await response.json()) as AuthResponse;
  if (!response.ok) {
    throw new Error(body.error || "Authentication request failed.");
  }
  return body;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function SignInWithSolana({
  endpoint = "/api/auth/solana",
  accountEndpoint = "/api/wallet-account",
  cluster = "mainnet-beta",
  className = "",
  walletLabel,
  networkLabel,
  balance,
  fiatValue,
  onSuccess,
  onError,
}: SignInWithSolanaProps) {
  const { connect, publicKey, signIn, signMessage, wallet } = useWallet();
  const titleId = useId();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<
    "loading" | "idle" | "signing" | "verifying" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceState, setBalanceState] = useState<BalanceState | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedAddress = publicKey?.toBase58();
  const walletAddress = session?.address || connectedAddress;
  const balanceKey = walletAddress ? `${walletAddress}:${cluster}` : null;

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`${endpoint}?session=1`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(readJson)
      .then((body) => {
        setSession(body.authenticated ? body.session || null : null);
        setStatus("idle");
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setStatus("error");
        setError(
          cause instanceof Error ? cause.message : "Could not read the session.",
        );
      });

    return () => controller.abort();
  }, [endpoint]);

  useEffect(() => {
    if (!walletAddress || !balanceKey || balance) return;

    const controller = new AbortController();
    const search = new URLSearchParams({
      address: walletAddress,
      cluster,
    });

    void fetch(`${accountEndpoint}?${search}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as BalanceResponse;
        if (!response.ok || body.balance === undefined) {
          throw new Error(body.error || "Could not load the wallet balance.");
        }
        return body.balance;
      })
      .then((value) => {
        setBalanceState({ key: balanceKey, value: `${value} SOL`, error: null });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setBalanceState({
          key: balanceKey,
          value: null,
          error:
            cause instanceof Error
              ? cause.message
              : "Could not load the wallet balance.",
        });
      });

    return () => controller.abort();
  }, [accountEndpoint, balance, balanceKey, cluster, walletAddress]);

  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );

  async function handleSignIn() {
    setError(null);

    try {
      if (!wallet) {
        throw new Error("Select a wallet before signing in.");
      }

      setStatus("signing");
      const challengeResponse = await fetch(endpoint, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const challengeBody = (await challengeResponse.json()) as {
        input?: SolanaSignInInput;
        error?: string;
      };
      if (!challengeResponse.ok || !challengeBody.input) {
        throw new Error(
          challengeBody.error || "Could not create a sign-in challenge.",
        );
      }

      let output: SolanaSignInOutput;

      if (signIn) {
        output = await signIn(challengeBody.input);
      } else {
        if (!signMessage) {
          throw new Error("This wallet does not support message signing.");
        }

        if (!wallet.adapter.connected) await connect();
        const activePublicKey = wallet.adapter.publicKey || publicKey;
        if (!activePublicKey) {
          throw new Error("The wallet did not provide a public key.");
        }

        const address = activePublicKey.toBase58();
        const input: SolanaSignInInputWithRequiredFields = {
          ...challengeBody.input,
          address,
          domain: challengeBody.input.domain || window.location.host,
        };
        const signedMessage = createSignInMessage(input);
        const signature = await signMessage(signedMessage);
        const chain = input.chainId?.startsWith("solana:")
          ? input.chainId
          : `solana:${input.chainId || "mainnet"}`;

        output = {
          account: {
            address,
            publicKey: activePublicKey.toBytes(),
            chains: [chain as `${string}:${string}`],
            features: ["solana:signMessage"],
          },
          signedMessage,
          signature,
          signatureType: "ed25519",
        };
      }

      setStatus("verifying");
      const verificationResponse = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: serializeOutput(output) }),
      });
      const verification = await readJson(verificationResponse);
      if (!verification.authenticated || !verification.session) {
        throw new Error("The server did not create a session.");
      }

      setSession(verification.session);
      setStatus("idle");
      onSuccess?.(verification.session);
    } catch (cause) {
      const nextError =
        cause instanceof Error ? cause : new Error("Sign in failed.");
      setStatus("error");
      setError(nextError.message);
      onError?.(nextError);
    }
  }

  async function handleSignOut() {
    setError(null);

    try {
      setStatus("verifying");
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
      });
      await readJson(response);
      setSession(null);
      setStatus("idle");
    } catch (cause) {
      const nextError =
        cause instanceof Error ? cause : new Error("Sign out failed.");
      setStatus("error");
      setError(nextError.message);
      onError?.(nextError);
    }
  }

  async function handleCopyAddress() {
    const address = session?.address || publicKey?.toBase58();
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setError("Could not copy the wallet address. Copy it from your wallet.");
    }
  }

  const isPending =
    status === "loading" || status === "signing" || status === "verifying";
  const resolvedWalletLabel =
    walletLabel ||
    (session && connectedAddress !== session.address
      ? "Authenticated Wallet"
      : wallet?.adapter.name || "Solana Wallet");
  const walletIcon =
    walletAddress === connectedAddress ? wallet?.adapter.icon : undefined;
  const resolvedNetworkLabel =
    networkLabel ||
    {
      "mainnet-beta": "Mainnet",
      devnet: "Devnet",
      testnet: "Testnet",
    }[cluster];
  const currentBalanceState =
    balanceKey && balanceState?.key === balanceKey ? balanceState : null;
  const displayedBalance = balance || currentBalanceState?.value;
  const balanceLoading = Boolean(
    walletAddress && !balance && !currentBalanceState,
  );
  const buttonLabel =
    status === "loading"
      ? "Checking Session…"
      : status === "signing"
        ? "Approve in Wallet…"
        : status === "verifying"
          ? "Verifying…"
          : wallet
            ? "Continue with Solana"
            : "Connect Wallet First";

  return (
    <section
      className={`w-full max-w-98 rounded-[22px] border border-zinc-200 bg-white px-8 py-10 text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32),0_4px_16px_rgba(0,0,0,0.2)] ${className}`}
      aria-labelledby={titleId}
      aria-busy={isPending}
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
        {session ? (
          <BadgeCheck size={28} strokeWidth={2} aria-hidden="true" />
        ) : (
          <SolanaMark tone="inverse" className="size-8" />
        )}
      </div>

      <div className="mt-7 text-center">
        <h2
          id={titleId}
          className="text-balance text-[32px] font-bold leading-10 tracking-[-0.04em] text-zinc-950 dark:text-zinc-50"
        >
          {session ? "Signed in with Solana" : "Sign in with Solana"}
        </h2>
        <p className="mt-3 text-pretty text-sm leading-5 text-zinc-500 dark:text-zinc-400">
          {session
            ? "Your wallet is connected securely."
            : "Connect your wallet to continue securely."}
        </p>
      </div>

      {walletAddress ? (
        <div
          className="relative mt-8 overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
          aria-live="polite"
        >
          <div className="relative flex items-center gap-3 px-5 py-4">
            <WalletAvatar icon={walletIcon} label={resolvedWalletLabel} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                  {resolvedWalletLabel}
                </p>
                {resolvedNetworkLabel ? (
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
                    {resolvedNetworkLabel}
                  </span>
                ) : null}
              </div>
              <p
                className="mt-1 truncate font-mono text-xs font-medium text-zinc-400 dark:text-zinc-400"
                title={walletAddress}
                translate="no"
              >
                {shortenAddress(walletAddress)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
              title={copied ? "Copied" : "Copy wallet address"}
              className={`flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-lg border transition-[background-color,border-color,color,opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:focus-visible:ring-white/25 ${
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
              {copied ? "Wallet address copied" : ""}
            </span>
          </div>

          <div className="relative flex min-h-20 items-end gap-3 bg-zinc-50 px-5 py-4 dark:bg-white/[0.025]">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                Balance
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <p
                  className="text-xl font-bold tabular-nums text-zinc-950 dark:text-zinc-100"
                  translate="no"
                >
                  {balanceLoading
                    ? "Loading…"
                    : displayedBalance || "Balance unavailable"}
                </p>
                {fiatValue && displayedBalance ? (
                  <p
                    className="text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-500"
                    translate="no"
                  >
                    {fiatValue}
                  </p>
                ) : null}
              </div>
              {currentBalanceState?.error ? (
                <p className="mt-1 max-w-55 text-[10px] leading-4 text-zinc-400 dark:text-zinc-500">
                  Could not load the current balance.
                </p>
              ) : null}
            </div>
            <div className="pointer-events-none absolute -bottom-1 right-4 flex size-14 items-center justify-center rounded-full bg-white/55 dark:bg-white/[0.035]">
              <SolanaMark tone="adaptive" className="size-8 opacity-25" />
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs leading-5 text-zinc-700 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        {session ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-zinc-100 px-5 text-base font-semibold text-zinc-700 transition-[background-color,color,opacity,transform,box-shadow] duration-150 hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/8 dark:text-zinc-300 dark:hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/25 dark:focus-visible:ring-offset-[#111113]"
          >
            {isPending ? (
              <LoaderCircle
                size={17}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut size={17} aria-hidden="true" />
            )}
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isPending || !wallet}
            className="flex min-h-15 w-full touch-manipulation items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-[background-color,opacity,transform,box-shadow] duration-150 hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#111113]"
          >
            {isPending ? (
              <LoaderCircle
                size={17}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <SolanaMark tone="inverse" className="size-5" />
            )}
            {buttonLabel}
          </button>
        )}
      </div>
    </section>
  );
}
