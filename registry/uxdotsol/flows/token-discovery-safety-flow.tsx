"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, Search, ShieldCheck } from "lucide-react";
import {
  useTokenList,
  type TokenListAdapter,
  type TokenListItem,
} from "@/hooks/uxdotsol/use-token-list";
import { TokenSafetyDisclosure } from "@/components/uxdotsol/components/token-safety-disclosure";

export type TokenDiscoverySafetyFlowProps = {
  initialQuery?: string;
  endpoint?: string;
  adapter?: TokenListAdapter;
  onTokenSelect?: (token: TokenListItem) => void;
  className?: string;
};

export function TokenDiscoverySafetyFlow({
  initialQuery = "",
  endpoint,
  adapter,
  onTokenSelect,
  className = "",
}: TokenDiscoverySafetyFlowProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<TokenListItem | null>(null);
  const tokenList = useTokenList(query, { adapter, endpoint });

  function selectToken(token: TokenListItem) {
    setSelected(token);
    onTokenSelect?.(token);
  }

  return (
    <section
      className={`w-full max-w-3xl rounded-[24px] border border-zinc-200 bg-white p-6 text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:p-7 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">
            Discover a token safely
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Search provider metadata, then review current risk signals before selection.
          </p>
        </div>
      </div>

      <label className="mt-6 flex min-h-14 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-zinc-950/20 dark:border-white/12 dark:bg-[#19191B] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:focus-within:ring-white/25">
        <Search size={17} className="shrink-0 text-zinc-400" aria-hidden="true" />
        <span className="sr-only">Search tokens</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Name, symbol, or mint address"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
        />
        {tokenList.isLoading ? (
          <Loader2 size={16} className="motion-safe:animate-spin text-zinc-400" aria-hidden="true" />
        ) : null}
      </label>

      {tokenList.error ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300" role="alert">
          <p className="font-semibold">Token search unavailable</p>
          <p className="mt-1">{tokenList.error.message}</p>
        </div>
      ) : null}

      {tokenList.tokens.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {tokenList.tokens.map((token) => (
            <button
              key={token.mint}
              type="button"
              onClick={() => selectToken(token)}
              className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:focus-visible:ring-white/25 ${
                selected?.mint === token.mint
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/8"
              }`}
            >
              {token.icon ? (
                <img src={token.icon} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  {token.symbol.slice(0, 2)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{token.name}</span>
                  {token.isVerified ? <BadgeCheck size={14} aria-label="Verified" /> : null}
                </span>
                <span className="mt-0.5 block truncate text-xs opacity-65">{token.symbol}</span>
              </span>
            </button>
          ))}
        </div>
      ) : query.trim().length >= 2 && tokenList.isSuccess ? (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No tokens matched this search.
        </p>
      ) : null}

      {selected ? (
        <div className="mt-6">
          <TokenSafetyDisclosure mint={selected.mint} />
        </div>
      ) : null}
    </section>
  );
}

export default TokenDiscoverySafetyFlow;
