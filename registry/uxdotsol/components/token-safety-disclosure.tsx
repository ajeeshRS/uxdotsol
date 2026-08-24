"use client";

import { useEffect, useRef } from "react";
import {
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  useTokenSafety,
  type TokenSafetyAdapter,
  type TokenSafetyAssessor,
  type TokenSafetyRisk,
  type TokenSafetyValue,
} from "@/hooks/uxdotsol/use-token-safety";

export type TokenSafetyDisclosureProps = {
  mint: string | null | undefined;
  adapter?: TokenSafetyAdapter;
  assess?: TokenSafetyAssessor;
  endpoint?: string;
  enabled?: boolean;
  title?: string;
  explorerBaseUrl?: string;
  showMetrics?: boolean;
  showExplorerLink?: boolean;
  compact?: boolean;
  onSafetyChange?: (value: TokenSafetyValue) => void;
  className?: string;
};

const RISK_CONTENT = {
  safe: {
    label: "No detected warnings",
    description: "Available metadata did not surface a known risk signal.",
    icon: ShieldCheck,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  caution: {
    label: "Review token risks",
    description: "One or more token properties need your attention.",
    icon: TriangleAlert,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  },
  danger: {
    label: "High-risk token",
    description: "A provider has flagged this token as suspicious or banned.",
    icon: ShieldAlert,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  },
  unknown: {
    label: "Risk unknown",
    description: "There is not enough verified metadata to assess this token.",
    icon: CircleHelp,
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300",
  },
} as const;

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function shortAddress(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
}

function formatMetric(value: number | null, compact = false) {
  if (value === null) return "Unavailable";
  return (compact ? COMPACT_NUMBER_FORMATTER : NUMBER_FORMATTER).format(value);
}

function getSafetySignature(value: TokenSafetyValue) {
  return [
    value.status,
    value.token?.mint ?? "",
    value.risk,
    value.reasons.map((reason) => `${reason.code}:${reason.severity}`).join("|"),
    value.error?.message ?? "",
  ].join(":");
}

function RiskIcon({ risk }: { risk: TokenSafetyRisk }) {
  const content = RISK_CONTENT[risk];
  const Icon = content.icon;
  return <Icon size={17} aria-hidden="true" />;
}

export function TokenSafetyDisclosure({
  mint,
  adapter,
  assess,
  endpoint,
  enabled = true,
  title = "Token safety",
  explorerBaseUrl = "https://solscan.io/token/",
  showMetrics = true,
  showExplorerLink = true,
  compact = false,
  onSafetyChange,
  className = "",
}: TokenSafetyDisclosureProps) {
  const safety = useTokenSafety(mint, { adapter, assess, enabled, endpoint });
  const callbackRef = useRef(onSafetyChange);
  const lastSignatureRef = useRef<string | null>(null);
  const signature = getSafetySignature(safety);

  useEffect(() => {
    callbackRef.current = onSafetyChange;
  }, [onSafetyChange]);

  useEffect(() => {
    if (lastSignatureRef.current === signature) return;
    lastSignatureRef.current = signature;
    callbackRef.current?.(safety);
  }, [safety, signature]);

  if (safety.status === "idle") {
    return (
      <div
        className={`w-full rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
      >
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <CircleHelp size={17} aria-hidden="true" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Provide a token mint to load current safety metadata.
        </p>
      </div>
    );
  }

  if (safety.status === "loading") {
    return (
      <div
        className={`w-full rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <Loader2 size={17} className="motion-safe:animate-spin" aria-hidden="true" />
          <p className="text-sm font-semibold">Checking token metadata…</p>
        </div>
        <p className="mt-2 truncate font-mono text-xs text-zinc-400">
          {mint?.trim()}
        </p>
      </div>
    );
  }

  if (safety.status === "error" || safety.status === "not-found") {
    const notFound = safety.status === "not-found";
    return (
      <div
        className={`w-full rounded-[24px] border border-red-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-red-500/20 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            size={18}
            className="mt-0.5 shrink-0 text-red-500"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {notFound ? "Token not found" : "Safety check unavailable"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {notFound
                ? "The provider returned no exact token for this mint. Treat its risk as unknown."
                : safety.error?.message ??
                  "The token provider could not be reached."}
            </p>
          </div>
          <button
            type="button"
            onClick={safety.refetch}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const token = safety.token;
  if (!token) return null;

  const riskContent = RISK_CONTENT[safety.risk];

  return (
    <section
      className={`w-full rounded-[24px] border border-zinc-200 bg-white ${
        compact ? "p-4" : "p-5"
      } shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] ${className}`}
      aria-label={title}
    >
      <div className="flex min-w-0 items-start gap-3">
        {token.icon ? (
          <img
            src={token.icon}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 object-cover dark:border-white/10 dark:bg-white/5"
          />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            {token.symbol.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {token.name}
            </h3>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {token.symbol}
            </span>
            {token.isVerified ? (
              <BadgeCheck
                size={15}
                className="text-blue-500"
                aria-label="Provider verified"
              />
            ) : null}
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {shortAddress(token.mint)}
          </p>
        </div>

        {showExplorerLink ? (
          <a
            href={`${explorerBaseUrl}${encodeURIComponent(token.mint)}`}
            target="_blank"
            rel="noreferrer"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:hover:bg-white/8 dark:hover:text-white dark:focus-visible:ring-white/25"
            aria-label="View token in explorer"
          >
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${riskContent.className}`}>
        <div className="flex items-center gap-2">
          <RiskIcon risk={safety.risk} />
          <p className="text-xs font-semibold">{riskContent.label}</p>
        </div>
        <p className="mt-1.5 text-xs leading-5 opacity-80">
          {riskContent.description}
        </p>
      </div>

      {safety.reasons.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {safety.reasons.map((reason) => (
            <li
              key={reason.code}
              className="flex items-start gap-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300"
            >
              {reason.severity === "danger" ? (
                <ShieldAlert
                  size={14}
                  className="mt-0.5 shrink-0 text-red-500"
                  aria-hidden="true"
                />
              ) : reason.severity === "warning" ? (
                <TriangleAlert
                  size={14}
                  className="mt-0.5 shrink-0 text-amber-500"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  size={14}
                  className="mt-0.5 shrink-0 text-blue-500"
                  aria-hidden="true"
                />
              )}
              <span>{reason.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {showMetrics && !compact ? (
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 text-xs dark:border-white/10 dark:bg-white/10">
          <div className="bg-zinc-50 p-3 dark:bg-[#19191B]">
            <dt className="text-zinc-400 dark:text-zinc-500">Verification</dt>
            <dd className="mt-1 font-semibold text-zinc-700 dark:text-zinc-300">
              {token.isVerified === null
                ? "Unknown"
                : token.isVerified
                  ? "Verified"
                  : "Unverified"}
            </dd>
          </div>
          <div className="bg-zinc-50 p-3 dark:bg-[#19191B]">
            <dt className="text-zinc-400 dark:text-zinc-500">Organic score</dt>
            <dd className="mt-1 font-semibold capitalize text-zinc-700 dark:text-zinc-300">
              {token.organicScoreLabel ?? "Unavailable"}
            </dd>
          </div>
          <div className="bg-zinc-50 p-3 dark:bg-[#19191B]">
            <dt className="text-zinc-400 dark:text-zinc-500">Liquidity</dt>
            <dd className="mt-1 font-mono font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
              {token.liquidity === null
                ? "Unavailable"
                : `$${formatMetric(token.liquidity, true)}`}
            </dd>
          </div>
          <div className="bg-zinc-50 p-3 dark:bg-[#19191B]">
            <dt className="text-zinc-400 dark:text-zinc-500">Holders</dt>
            <dd className="mt-1 font-mono font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatMetric(token.holderCount)}
            </dd>
          </div>
        </dl>
      ) : null}

      {!compact ? (
        <p className="mt-3 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
          Safety metadata is informational, may be incomplete or delayed, and is
          not a guarantee. Always verify the mint address.
        </p>
      ) : null}
    </section>
  );
}

export default TokenSafetyDisclosure;
