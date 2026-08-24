"use client";

import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Copy, Check, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import NumberFlow from "@number-flow/react";

const DEFAULT_API_URL = "/api/coin-price";
const DEFAULT_TOKEN_NAME = "solana";

type CoinPricePoint = {
  timestamp: number;
  time: string;
  price: number;
};

type CoinPricePayload = {
  id: string;
  symbol: string;
  name: string;
  image?: string | null;
  tokenAddress?: string | null;
  currentPrice: number;
  changePercent24h: number;
  high24h: number | null;
  low24h: number | null;
  marketCap: string | null;
  volume24h: string | null;
  rank: string | null;
  prices: CoinPricePoint[];
  updatedAt: string | null;
};

type CoinPriceProps = {
  apiUrl?: string;
  tokenName?: string;
  className?: string;
};

function formatPrice(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  });
}

function getPriceStats(data: CoinPricePayload | null) {
  const prices = data?.prices ?? [];
  const firstPrice = prices[0]?.price ?? data?.currentPrice ?? 0;
  const chartLastPrice = prices[prices.length - 1]?.price ?? data?.currentPrice ?? 0;
  const lastPrice = data?.currentPrice ?? chartLastPrice;
  const chartPrices = prices.map((d) => d.price);
  const lowPrice = data?.low24h ?? (chartPrices.length ? Math.min(...chartPrices) : lastPrice);
  const highPrice = data?.high24h ?? (chartPrices.length ? Math.max(...chartPrices) : lastPrice);
  const changePercent = data?.changePercent24h ?? 0;
  const isUptrend = changePercent >= 0;
  const priceRange = Math.max(highPrice - lowPrice, Math.abs(lastPrice) * 0.01, 1);
  const yPad = priceRange * 0.08;

  return {
    priceData: prices,
    firstPrice,
    lastPrice,
    highPrice,
    lowPrice,
    isUptrend,
    lineColor: isUptrend ? "#10b981" : "#f43f5e",
    gradientId: isUptrend ? "greenGrad" : "redGrad",
    currentPrice: formatPrice(lastPrice),
    displayChange: Math.abs(changePercent).toFixed(2),
    changeSign: isUptrend ? "+" : "−",
    yMin: lowPrice - yPad,
    yMax: highPrice + yPad,
  };
}

function buildPriceUrl(apiUrl: string, tokenName: string) {
  const url = new URL(apiUrl, window.location.origin);
  url.searchParams.set("tokenName", tokenName);
  return url.toString();
}

function shortenTokenId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function getFallbackSymbol(tokenName: string) {
  return tokenName.trim().slice(0, 4).toUpperCase() || "TOK";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CoinPriceInner({
  apiUrl = DEFAULT_API_URL,
  tokenName = DEFAULT_TOKEN_NAME,
  className,
}: CoinPriceProps) {
  const resolvedTokenName = tokenName.trim() || DEFAULT_TOKEN_NAME;
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned,  setIsPinned]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [priceData, setPriceData] = useState<CoinPricePayload | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (copyTimer.current)    clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrice() {
      try {
        const response = await fetch(buildPriceUrl(apiUrl, resolvedTokenName), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Price unavailable");

        const nextData = (await response.json()) as CoinPricePayload;
        setPriceData(nextData);
        setPriceError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPriceError(error instanceof Error ? error.message : "Price unavailable");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadPrice();
    const interval = window.setInterval(loadPrice, 30_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [apiUrl, resolvedTokenName]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (isPinned && wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setIsPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPinned) {
        setIsPinned(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [isPinned]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setIsHovered(false), 120);
  }, []);

  const tokenIdentifier = priceData?.tokenAddress ?? priceData?.id ?? resolvedTokenName;

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tokenIdentifier).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }, [tokenIdentifier]);

  const togglePinned = useCallback(() => {
    setIsPinned((p) => !p);
    setIsHovered(true);
  }, []);

  const showSkeleton = isLoading && !priceData;
  const isOpen     = !showSkeleton && (isHovered || isPinned);
  const {
    priceData: chartData,
    firstPrice,
    lastPrice,
    highPrice,
    lowPrice,
    isUptrend,
    lineColor,
    gradientId,
    currentPrice,
    displayChange,
    changeSign,
    yMin,
    yMax,
  } = useMemo(() => getPriceStats(priceData), [priceData]);
  const chartConfig = useMemo(
    () => ({ price: { label: "Price", color: lineColor } }) as const,
    [lineColor],
  );
  const rangeWidth = `${Math.min(
    100,
    Math.max(0, ((lastPrice - lowPrice) / Math.max(highPrice - lowPrice, 1)) * 100),
  )}%`;
  const symbol = priceData?.symbol ?? getFallbackSymbol(resolvedTokenName);
  const name = priceData?.name ?? resolvedTokenName;
  const shortTokenIdentifier = shortenTokenId(tokenIdentifier);
  const footerStats = [
    { label: "Mkt Cap", value: priceData?.marketCap ?? "--" },
    { label: "Volume", value: priceData?.volume24h ?? "--" },
    { label: "Rank", value: priceData?.rank ?? "--" },
  ];

  return (
    <div
      ref={wrapperRef}
      className={cn("relative inline-flex flex-col items-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Pill ─────────────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePinned}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={`Open ${name} price details`}
        aria-busy={showSkeleton}
        className={cn(
          "flex h-9 items-center gap-3 rounded-xl px-3",
          "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
          "shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
          "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02] active:scale-[0.98]",
          "motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        {showSkeleton ? (
          <PricePillSkeleton />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <TokenLogo image={priceData?.image} symbol={symbol} className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
                {symbol}
              </span>
            </div>
            <span className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">
              ${currentPrice}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                isUptrend
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
              )}
            >
              {changeSign}{displayChange}%
            </span>
          </>
        )}
      </button>

      {/* ── Detail card ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={dialogId}
            role="dialog"
            aria-label={`${name} price details`}
            initial={reduceMotion ? { opacity: 0 } : {
              opacity: 0,
              transform: "translateY(6px) scale(0.97)",
            }}
            animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
            exit={reduceMotion ? { opacity: 0 } : {
              opacity: 0,
              transform: "translateY(4px) scale(0.97)",
            }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.18,
              ease: reduceMotion ? "linear" : [0.23, 1, 0.32, 1],
            }}
            style={{ transformOrigin: "top center", translate: "-50% 0" }}
            className="absolute top-[calc(100%+8px)] left-1/2 z-50 w-72"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Caret */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border-l border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950" />

            {/* Card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
              {/* Header */}
              <div className="flex items-start justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <TokenLogo image={priceData?.image} symbol={symbol} className="h-8 w-8 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold leading-none tracking-tight text-neutral-900 dark:text-white">
                        {name}
                      </span>
                      <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-400 border border-neutral-200 dark:border-neutral-700 dark:text-neutral-500">
                        {symbol}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="mt-1 flex items-center gap-1 group/addr focus:outline-none"
                      aria-label="Copy token identifier"
                    >
                      <span className="font-mono text-[10px] text-neutral-400 group-hover/addr:text-neutral-600 transition-colors dark:group-hover/addr:text-neutral-300">
                        {shortTokenIdentifier}
                      </span>
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.span
                            key="check"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                            transition={{
                              duration: 0.12,
                              ease: reduceMotion ? "linear" : [0.23, 1, 0.32, 1],
                            }}
                          >
                            <Check className="h-3 w-3 text-emerald-500" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                            transition={{
                              duration: 0.12,
                              ease: reduceMotion ? "linear" : [0.23, 1, 0.32, 1],
                            }}
                          >
                            <Copy className="h-3 w-3 text-neutral-300 group-hover/addr:text-neutral-500 transition-colors dark:text-neutral-600 dark:group-hover/addr:text-neutral-400" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[20px] font-bold tabular-nums leading-none tracking-tight text-neutral-900 dark:text-white">
                    ${currentPrice}
                  </span>
                  <div
                    className={cn(
                      "mt-1.5 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums",
                      isUptrend
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
                    )}
                  >
                    {isUptrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {changeSign}{displayChange}%
                  </div>
                </div>
              </div>

              {/* Chart — linear interpolation + tight domain = real-looking price action */}
              <div className="h-24 w-full">
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer>
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={lineColor} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={lineColor} stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[yMin, yMax]} hide />
                        <ReferenceLine
                          y={firstPrice}
                          stroke="rgba(128,128,128,0.2)"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={lineColor}
                          strokeWidth={1.5}
                          fill={`url(#${gradientId})`}
                          dot={false}
                          isAnimationActive={false}
                          activeDot={{ r: 3, fill: lineColor, stroke: "#fff", strokeWidth: 1.5 }}
                        />
                        <ChartTooltip
                          cursor={{ stroke: "rgba(128,128,128,0.2)", strokeWidth: 1 }}
                          content={
                            <ChartTooltipContent
                              className="border-neutral-200 bg-white/95 text-[11px] backdrop-blur-sm w-fit dark:border-neutral-800 dark:bg-neutral-950/95"
                              labelFormatter={(v) => v}
                              formatter={(value) => (
                                <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                                  $<NumberFlow value={Number(Number(value).toFixed(2))} />
                                </span>
                              )}
                            />
                          }
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div role="status" aria-live="polite" className="flex h-full items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500">
                    {priceError ?? "Loading live price…"}
                  </div>
                )}
              </div>

              {/* 24h range */}
              <div className="px-4 pt-2 pb-3">
                <div className="mb-1.5 flex justify-between">
                  <span className="font-mono text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    L ${lowPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">24h</span>
                  <span className="font-mono text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    H ${highPrice.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full"
                    style={{ background: lineColor, width: rangeWidth, opacity: 0.7 }}
                  />
                </div>
              </div>

              {/* Footer stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                {footerStats.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const CoinPrice = memo(CoinPriceInner);
export default CoinPrice;

function TokenLogo({
  image,
  symbol,
  className,
}: {
  image?: string | null;
  symbol: string;
  className?: string;
}) {
  if (symbol === "SOL") {
    return <SolanaLogo className={className} />;
  }

  if (image) {
    return (
      <span
        aria-label={`${symbol} logo`}
        role="img"
        className={cn("rounded-full object-cover", className)}
        style={{ backgroundImage: `url(${image})`, backgroundPosition: "center", backgroundSize: "cover" }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-neutral-900 text-[8px] font-bold text-white dark:bg-white dark:text-neutral-950",
        className,
      )}
    >
      {symbol.slice(0, 1)}
    </span>
  );
}

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "block motion-safe:animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
      style={style}
    />
  );
}

function PricePillSkeleton() {
  return (
    <span className="flex items-center gap-3" aria-hidden="true">
      <span className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-4 shrink-0" />
        <Skeleton className="h-4 w-9 rounded-md" />
      </span>
      <span className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />
      <Skeleton className="h-4 w-14 rounded-md" />
      <Skeleton className="h-5 w-12 rounded-md" />
    </span>
  );
}

function SolanaLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
      <path fill="url(#SOL__a)" d="M18.413 7.903a.62.62 0 0 1-.411.164H3.58c-.512 0-.77-.585-.416-.929l2.368-2.283a.6.6 0 0 1 .41-.169h14.479c.517 0 .77.59.41.934z" />
      <path fill="url(#SOL__b)" d="M18.413 19.157a.6.6 0 0 1-.411.157H3.58c-.512 0-.77-.58-.416-.923l2.368-2.289a.6.6 0 0 1 .41-.163h14.479c.517 0 .77.585.41.928z" />
      <path fill="url(#SOL__c)" d="M18.413 10.472a.6.6 0 0 0-.411-.158H3.58c-.512 0-.77.58-.416.922l2.368 2.29a.62.62 0 0 0 .41.163h14.479c.517 0 .77-.585.41-.928z" />
      <defs>
        <linearGradient id="SOL__a" x1="3.001" x2="21.431" y1="16.322" y2="15.591" gradientUnits="userSpaceOnUse">
          <stop stopColor="#599DB0" /><stop offset={1} stopColor="#47F8C3" />
        </linearGradient>
        <linearGradient id="SOL__b" x1="3.001" x2="21.323" y1="16.973" y2="16.366" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C44FE2" /><stop offset={1} stopColor="#73B0D0" />
        </linearGradient>
        <linearGradient id="SOL__c" x1="4.035" x2="20.302" y1="12.002" y2="12.002" gradientUnits="userSpaceOnUse">
          <stop stopColor="#778CBF" /><stop offset={1} stopColor="#5DCDC9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
