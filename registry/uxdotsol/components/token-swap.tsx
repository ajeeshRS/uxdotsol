"use client";

/**
 * @file TokenSwapCard — A self-contained token swap widget for Solana dApps.
 *
 * Includes a token selector dropdown, amount input with optional USD conversion,
 * a flip button to reverse the pair, and callback-driven swap execution states.
 *
 * @module uxdotsol/components/token-swap
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import {
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Check,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents a single tradable token. */
export interface Token {
  /** Ticker symbol, e.g. `"SOL"`. */
  symbol: string;
  /** Full display name, e.g. `"Solana"`. */
  name: string;
  /** Optional URL for the token logo image. Falls back to {@link TOKEN_LOGO_URLS}. */
  logoUrl?: string;
  /** User's current balance string, e.g. `"12.500"`. */
  balance?: string;
  /** Current USD price per unit. Used to compute exchange rates. */
  usdPrice?: number;
}

/** Props for {@link TokenSwapCard}. */
export interface TokenSwapCardProps {
  /**
   * List of tokens available for selection.
   * @default DEFAULT_TOKENS
   */
  tokens?: Token[];
  /** Pre-selected "from" token. Defaults to the first token in the list. */
  defaultFrom?: Token;
  /** Pre-selected "to" token. Defaults to the second token in the list. */
  defaultTo?: Token;
  /**
   * Available slippage tolerance options (in percent).
   * @default [0.1, 0.5, 1.0]
   */
  slippageOptions?: number[];
  /**
   * Static exchange rate label shown in the header when USD prices are
   * unavailable. When both tokens have `usdPrice` set, a dynamic rate is used.
   */
  rateLabel?: string;
  /**
   * Network fee string shown in the footer.
   * @default "Calculated at signing"
   */
  networkFee?: string;
  /**
   * Required to enable execution. Resolve only after the real swap operation
   * reaches the success boundary your product promises to users.
   */
  onSwap?: (from: Token, to: Token, amount: string) => void | Promise<void>;
  /** Optional Tailwind / CSS class forwarded to the card root element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Module-scoped constants (computed once, never on re-render)
// ---------------------------------------------------------------------------

/**
 * Well-known token logo URLs sourced from the Solana token list and
 * TrustWallet assets. Keyed by ticker symbol.
 *
 * @internal
 */
const TOKEN_LOGO_URLS: Record<string, string> = {
  SOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  RAY: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  BONK: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  USDT: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  MATIC:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
};

/**
 * Known token options used when no token source is supplied. Dynamic balances
 * and prices are intentionally omitted rather than fabricated.
 */
const DEFAULT_TOKENS: Token[] = [
  { symbol: "SOL", name: "Solana" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "RAY", name: "Raydium" },
  { symbol: "BONK", name: "Bonk" },
  { symbol: "USDT", name: "Tether" },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * A thin horizontal separator line used between card sections.
 *
 * @internal
 */
function Divider() {
  return <div className="h-px bg-zinc-100 dark:bg-white/6" />;
}

/**
 * Renders a token's logo image, falling back to a two-letter initials pill
 * when the image URL is unavailable or fails to load.
 *
 * @internal
 */
function TokenLogo({ token, size = 22 }: { token: Token; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = token.logoUrl ?? TOKEN_LOGO_URLS[token.symbol];
  const initials = token.symbol.slice(0, 2).toUpperCase();

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={token.symbol}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setImgError(true)}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="font-bold text-zinc-500 dark:text-zinc-400"
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </span>
    </div>
  );
}

/** Props for {@link TokenSelector}. @internal */
interface TokenSelectorProps {
  selected: Token;
  tokens: Token[];
  onChange: (t: Token) => void;
  /** Token to exclude from the dropdown list (usually the opposing pair leg). */
  exclude?: Token;
}

/**
 * A pill button that opens a floating dropdown for selecting a token.
 * Closes on outside click via a `mousedown` listener on `document`.
 *
 * @internal
 */
function TokenSelector({
  selected,
  tokens,
  onChange,
  exclude,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const availableTokens = useMemo(
    () => tokens.filter((token) => token.symbol !== exclude?.symbol),
    [exclude?.symbol, tokens],
  );

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, open]);

  // Close the dropdown when a click lands outside this component's root.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openAt = useCallback(
    (index: number) => {
      const lastIndex = Math.max(availableTokens.length - 1, 0);
      setActiveIndex(Math.min(Math.max(index, 0), lastIndex));
      setOpen(true);
    },
    [availableTokens.length],
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const selectedIndex = availableTokens.findIndex(
        (token) => token.symbol === selected.symbol,
      );
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        openAt(selectedIndex >= 0 ? selectedIndex : availableTokens.length - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        openAt(0);
      } else if (event.key === "End") {
        event.preventDefault();
        openAt(availableTokens.length - 1);
      }
    },
    [availableTokens, openAt, selected.symbol],
  );

  const handleListboxKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const lastIndex = availableTokens.length - 1;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index >= lastIndex ? 0 : index + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? lastIndex : index - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(lastIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "Tab") {
        setOpen(false);
      }
    },
    [availableTokens.length],
  );

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Pill trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const selectedIndex = availableTokens.findIndex(
            (token) => token.symbol === selected.symbol,
          );
          openAt(selectedIndex >= 0 ? selectedIndex : 0);
        }}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-h-10 items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/8 hover:bg-zinc-200 dark:hover:bg-white/13 transition-colors duration-150 cursor-pointer border border-black/6 dark:border-white/8 shadow-[0_1px_4px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={`Select ${selected.symbol} token`}
      >
        <TokenLogo token={selected} size={20} />
        <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
          {selected.symbol}
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-50 w-48 rounded-2xl overflow-hidden bg-white dark:bg-[#111113] border border-black/6 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div
            id={listboxId}
            role="listbox"
            aria-label="Available tokens"
            onKeyDown={handleListboxKeyDown}
            className="p-1"
          >
            {availableTokens.map((t, index) => (
                    <button
                      ref={(node) => { optionRefs.current[index] = node; }}
                      type="button"
                      role="option"
                      aria-selected={t.symbol === selected.symbol}
                      key={t.symbol}
                      onClick={() => {
                        onChange(t);
                        setOpen(false);
                      }}
                      onFocus={() => setActiveIndex(index)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15 ${
                        t.symbol === selected.symbol
                          ? "bg-zinc-50 dark:bg-white/4"
                          : ""
                      }`}
                    >
                      <TokenLogo token={t} size={22} />
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100">
                          {t.symbol}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate w-full text-left">
                          {t.name}
                        </span>
                      </div>
                      {t.balance && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                          {t.balance}
                        </span>
                      )}
                      {t.symbol === selected.symbol && (
                        <Check size={12} aria-hidden="true" className="text-blue-500 shrink-0" />
                      )}
                    </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Props for {@link AmountPanel}. @internal */
interface AmountPanelProps {
  /** Section label rendered above the amount input. */
  label: string;
  token: Token;
  tokens: Token[];
  /** Current raw amount string. */
  amount: string;
  /** Called when the user types in the editable input. */
  onAmountChange?: (v: string) => void;
  onTokenChange: (t: Token) => void;
  /** Token to exclude from the selector dropdown. */
  excludeToken?: Token;
  /** Pre-formatted USD equivalent string, shown below the amount. */
  usdValue?: string | null;
  /**
   * When `true`, renders an `<input>` for user entry.
   * When `false`, renders a read-only animated number.
   * @default true
   */
  editable?: boolean;
  /** Shown as the balance shortcut button when the token has a balance. */
  onMax?: () => void;
}

/**
 * A layered inner panel containing a token amount field and a token selector.
 * Used for both the "You pay" and "You receive" rows of the swap card.
 *
 * @internal
 */
function AmountPanel({
  label,
  token,
  tokens,
  amount,
  onAmountChange,
  onTokenChange,
  excludeToken,
  usdValue,
  editable = true,
  onMax,
}: AmountPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-white/4 border border-black/5 dark:border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Row: label + MAX balance shortcut */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
        {onMax && token.balance && (
          <button
            type="button"
            onClick={onMax}
            className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
          >
            Balance: {token.balance}
          </button>
        )}
      </div>

      {/* Row: amount field + token selector */}
      <div className="flex min-w-0 items-center gap-2">
        {editable ? (
          <input
            type="number"
            name={label === "You pay" ? "pay-amount" : "receive-amount"}
            autoComplete="off"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange?.(e.target.value)}
            // Suppress browser spinner arrows on number inputs.
            style={{ MozAppearance: "textfield" }}
            className="min-w-0 flex-1 bg-transparent text-[22px] font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none tabular-nums field-sizing-content [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={`${label} amount`}
          />
        ) : (
          <span
            className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[22px] font-bold tabular-nums ${
              amount
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-300 dark:text-zinc-700"
            }`}
          >
            {amount ? (
              <NumberFlow
                value={Number(amount)}
                format={{ minimumFractionDigits: 0, maximumFractionDigits: 4 }}
              />
            ) : (
              "0.00"
            )}
          </span>
        )}
        <TokenSelector
          selected={token}
          tokens={tokens}
          onChange={onTokenChange}
          exclude={excludeToken}
        />
      </div>

      {/* USD equivalent */}
      {usdValue && (
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600 tabular-nums">
          ≈ ${usdValue}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TokenSwapCard
// ---------------------------------------------------------------------------

/**
 * A polished token swap card for Solana dApps.
 *
 * Features:
 * - Live exchange rate display derived from static `usdPrice` values.
 * - Token selector dropdowns with logo images and balance hints.
 * - One-click pair flip with amount carry-over.
 * - Configurable slippage tolerance pills.
 * - Animated swap button (`idle` → `swapping` → `success`).
 *
 * @example
 * // Minimal usage with defaults.
 * <TokenSwapCard />
 *
 * @example
 * // With custom token list and swap handler.
 * <TokenSwapCard
 *   tokens={myTokens}
 *   defaultFrom={solToken}
 *   defaultTo={usdcToken}
 *   onSwap={(from, to, amount) => console.log(from, to, amount)}
 * />
 */
export function TokenSwapCard({
  tokens = DEFAULT_TOKENS,
  defaultFrom,
  defaultTo,
  slippageOptions = [0.1, 0.5, 1.0],
  rateLabel,
  networkFee = "Calculated at signing",
  onSwap,
  className = "",
}: TokenSwapCardProps) {
  const [fromToken, setFromToken] = useState<Token>(defaultFrom ?? tokens[0]);
  const [toToken, setToToken] = useState<Token>(defaultTo ?? tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(slippageOptions[1]);
  const [swapping, setSwapping] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const isHighSlippage = slippage >= 1;

  // --------------- Derived values (recalculated on each render) -------------

  /** Estimated receive amount based on USD price ratio. */
  const toAmount =
    fromAmount && fromToken.usdPrice && toToken.usdPrice
      ? (
          (parseFloat(fromAmount) * fromToken.usdPrice) /
          toToken.usdPrice
        ).toFixed(toToken.usdPrice < 0.01 ? 0 : 4)
      : "";

  /** USD equivalent of the pay-side amount. `null` when unavailable. */
  const fromUsd =
    fromAmount && fromToken.usdPrice
      ? (parseFloat(fromAmount) * fromToken.usdPrice).toFixed(2)
      : null;

  /**
   * Dynamic rate string shown in the header, e.g. `"1 SOL = 142.3000 USDC"`.
   * Falls back to the static `rateLabel` prop when prices are missing.
   */
  const dynamicRate =
    fromToken.usdPrice && toToken.usdPrice
      ? `1 ${fromToken.symbol} = ${(
          fromToken.usdPrice / toToken.usdPrice
        ).toFixed(toToken.usdPrice < 0.01 ? 2 : 4)} ${toToken.symbol}`
      : rateLabel;

  /** Whether the swap button should be enabled. */
  const canSwap = Boolean(
    onSwap &&
      fromAmount &&
      Number.isFinite(parseFloat(fromAmount)) &&
      parseFloat(fromAmount) > 0,
  );

  // --------------- Stable callbacks ----------------------------------------

  /**
   * Swaps the from/to token pair and carries the computed receive amount
   * into the pay field so the user doesn't lose context.
   */
  const handleFlip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setSwapped(false);
    setSwapError(null);
  }, [fromToken, toToken, toAmount]);

  const handleAmountChange = useCallback((value: string) => {
    setFromAmount(value);
    setSwapped(false);
    setSwapError(null);
  }, []);

  const handleFromTokenChange = useCallback((token: Token) => {
    setFromToken(token);
    setSwapped(false);
    setSwapError(null);
  }, []);

  const handleToTokenChange = useCallback((token: Token) => {
    setToToken(token);
    setSwapped(false);
    setSwapError(null);
  }, []);

  const handleSlippageChange = useCallback((value: number) => {
    setSlippage(value);
    setSwapped(false);
    setSwapError(null);
  }, []);

  /**
   * Delegates execution to the supplied real integration and reflects its
   * resolved or rejected state without fabricating progress or success.
   */
  const handleSwap = useCallback(async () => {
    if (!fromAmount || swapping || !onSwap) return;
    setSwapping(true);
    setSwapped(false);
    setSwapError(null);

    try {
      await onSwap(fromToken, toToken, fromAmount);
      setSwapped(true);
    } catch (cause) {
      setSwapError(
        cause instanceof Error ? cause.message : "The swap operation failed.",
      );
    } finally {
      setSwapping(false);
    }
  }, [fromAmount, swapping, fromToken, toToken, onSwap]);

  return (
    <div
      className={`
        relative w-[320px] rounded-3xl overflow-visible
        bg-white dark:bg-[#111113]
        border border-black/5 dark:border-white/8
        shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]
        transition-shadow duration-300
        ${className}
      `}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {/* Overlapping token logos */}
            <div className="flex items-center -space-x-2">
              <div className="rounded-full ring-2 ring-white dark:ring-[#111113]">
                <TokenLogo token={fromToken} size={22} />
              </div>
              <div className="rounded-full ring-2 ring-white dark:ring-[#111113]">
                <TokenLogo token={toToken} size={22} />
              </div>
            </div>
            <h3 className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Swap tokens
            </h3>
          </div>
          {/* Dynamic / static rate label */}
          {dynamicRate && (
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">
              {dynamicRate}
            </span>
          )}
        </div>

        {/* Slippage tolerance pills */}
        <div className="flex items-center gap-1">
          {slippageOptions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => handleSlippageChange(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15 ${
                slippage === s
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── Body ── */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
        {/* Pay panel */}
        <AmountPanel
          label="You pay"
          token={fromToken}
          tokens={tokens}
          amount={fromAmount}
          onAmountChange={handleAmountChange}
          onTokenChange={handleFromTokenChange}
          excludeToken={toToken}
          usdValue={fromUsd}
          editable
          onMax={() =>
            handleAmountChange(fromToken.balance?.replace(/,/g, "") ?? "")
          }
        />

        {/* Flip button */}
        <div className="flex justify-center -my-0.5 relative z-10">
          <button
            type="button"
            onClick={handleFlip}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-[#111113] border border-black/6 dark:border-white/8 hover:bg-zinc-50 dark:hover:bg-white/6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[background-color,transform,box-shadow] duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
            aria-label="Flip token pair"
          >
            <ArrowUpDown size={13} className="text-zinc-400" />
          </button>
        </div>

        {/* Receive panel */}
        <AmountPanel
          label="You receive"
          token={toToken}
          tokens={tokens}
          amount={toAmount}
          onTokenChange={handleToTokenChange}
          excludeToken={fromToken}
          editable={false}
        />

        <Divider />

        {/* Slippage + fee summary */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
            <Tag size={11} />
            <span className="text-[11px]">Slippage: {slippage}%</span>
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Fee: {networkFee}
          </span>
        </div>

        {isHighSlippage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            High slippage can materially change your final receive amount.
          </div>
        ) : null}

        {swapError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {swapError}
          </p>
        ) : null}

        {/* Swap button */}
        <button
          type="button"
          onClick={handleSwap}
          disabled={!canSwap || swapping || swapped}
          className={`
            w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            text-[13px] font-semibold tracking-tight transition-[background-color,color,opacity,transform,box-shadow] duration-150 cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]
            disabled:cursor-not-allowed
            ${
              swapped
                ? "bg-emerald-500 text-white"
                : !canSwap
                  ? "bg-zinc-100 dark:bg-white/6 text-zinc-400 dark:text-zinc-500"
                  : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 active:scale-[0.97] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            }
          `}
          aria-busy={swapping}
        >
          {swapping ? (
            <>
              <Loader2 size={14} className="motion-safe:animate-spin" />
              Confirm in wallet…
            </>
          ) : swapped ? (
            <>
              <CheckCircle2 size={14} />
              Swap complete
            </>
          ) : !onSwap ? (
            "Swap integration required"
          ) : (
            "Swap now"
          )}
        </button>
      </div>
    </div>
  );
}

export default TokenSwapCard;
