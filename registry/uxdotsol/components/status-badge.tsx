"use client";

/**
 * @file status-badge — A generic `ChainBadge` primitive and a pre-wired
 * `SolanaStatusBadge` that reflects live Solana network health by polling
 * the official Statuspage v2 API.
 *
 * @module uxdotsol/components/status-badge
 */

import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";

// ---------------------------------------------------------------------------
// Status style map
// ---------------------------------------------------------------------------

/**
 * Visual tokens keyed by the normalised status string.
 * Indicator values from https://status.solana.com/api/v2/status.json are
 * mapped to these keys via {@link indicatorToStatus}.
 *
 * | indicator  | key        | colour  |
 * |------------|------------|---------|
 * | `"none"`   | `active`   | emerald |
 * | `"minor"`  | `minor`    | yellow  |
 * | `"major"`  | `major`    | orange  |
 * | `"critical"`| `critical`| red     |
 */
const STATUS: Record<
  string,
  { dot: string; ring: string; label: string; text: string; animate: boolean }
> = {
  /** All systems operational — maps from `indicator: "none"`. */
  active: {
    dot: "bg-emerald-500",
    ring: "bg-emerald-500",
    label: "text-emerald-600 dark:text-emerald-400",
    text: "Operational",
    animate: true,
  },
  /** Minor service disruption — maps from `indicator: "minor"`. */
  minor: {
    dot: "bg-yellow-400",
    ring: "bg-yellow-400",
    label: "text-yellow-600 dark:text-yellow-400",
    text: "Degraded",
    animate: true,
  },
  /** Partial system outage — maps from `indicator: "major"`. */
  major: {
    dot: "bg-orange-500",
    ring: "",
    label: "text-orange-500 dark:text-orange-400",
    text: "Partial Outage",
    animate: false,
  },
  /** Major system outage — maps from `indicator: "critical"`. */
  critical: {
    dot: "bg-red-500",
    ring: "",
    label: "text-red-500 dark:text-red-400",
    text: "Major Outage",
    animate: false,
  },
  /** Generic down state; kept for backwards compatibility. */
  down: {
    dot: "bg-red-500",
    ring: "",
    label: "text-red-500 dark:text-red-400",
    text: "Down",
    animate: false,
  },
};

// ---------------------------------------------------------------------------
// Size scale
// ---------------------------------------------------------------------------

/** Size token shape used by the SIZE map. */
interface SizeTokens {
  badge: string;
  icon: string;
  name: string;
  sub: string;
  dotWrap: string;
  dotCore: string;
  statusText: string;
  ms: string;
  divider: string;
  /** Tailwind height class for the loading skeleton. */
  skeletonH: string;
}

/** Responsive size scale for {@link ChainBadge}. */
const SIZE: Record<string, SizeTokens> = {
  sm: {
    badge: "px-2 py-1.5 gap-2",
    icon: "w-6 h-6",
    name: "text-xs",
    sub: "hidden",
    dotWrap: "w-2.5 h-2.5",
    dotCore: "w-1.5 h-1.5",
    statusText: "text-[11px]",
    ms: "hidden",
    divider: "h-4",
    skeletonH: "h-9",
  },
  md: {
    badge: "px-3 py-2 gap-2.5",
    icon: "w-8 h-8",
    name: "text-[13px]",
    sub: "text-[11px]",
    dotWrap: "w-2.5 h-2.5",
    dotCore: "w-[7px] h-[7px]",
    statusText: "text-[11px]",
    ms: "text-[10px]",
    divider: "h-6",
    skeletonH: "h-11",
  },
  lg: {
    badge: "px-4 py-2.5 gap-3",
    icon: "w-10 h-10",
    name: "text-sm",
    sub: "text-xs",
    dotWrap: "w-3 h-3",
    dotCore: "w-2 h-2",
    statusText: "text-xs",
    ms: "text-[11px]",
    divider: "h-6",
    skeletonH: "h-12",
  },
};

// ---------------------------------------------------------------------------
// Statuspage API types
// ---------------------------------------------------------------------------

/** Shape of the response from `https://status.solana.com/api/v2/status.json`. */
interface SolanaStatusResponse {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    /**
     * One of `"none"` | `"minor"` | `"major"` | `"critical"`.
     * @see https://metastatuspage.com/api#status
     */
    indicator: string;
    /** Human-readable description e.g. `"All Systems Operational"`. */
    description: string;
  };
}

/**
 * Maps a raw Statuspage `indicator` string to a {@link STATUS} key.
 * Unrecognised values fall back to `"active"` (the safest default).
 *
 * @internal
 */
function indicatorToStatus(indicator: string): string {
  switch (indicator) {
    case "none":
      return "active";
    case "minor":
      return "minor";
    case "major":
      return "major";
    case "critical":
      return "critical";
    default:
      return "active";
  }
}

// ---------------------------------------------------------------------------
// useSolanaStatus hook
// ---------------------------------------------------------------------------

/** Return type of {@link useSolanaStatus}. */
export interface UseSolanaStatusReturn {
  /** Normalised status key — one of the keys in `STATUS`. */
  status: string;
  /** Human-readable description string returned by the API. */
  description: string;
  /** ISO-8601 timestamp of the last Statuspage update, or `null` while loading. */
  updatedAt: string | null;
  /** `true` while the fetch is in-flight. */
  loading: boolean;
  /** `true` when the fetch failed (network error or non-2xx response). */
  error: boolean;
  /** Call to re-trigger the status fetch immediately. */
  refetch: () => void;
}

/**
 * Fetches live Solana network status from the Statuspage v2 API.
 *
 * - Fires on mount and on every {@link UseSolanaStatusReturn.refetch} call.
 * - Cancels in-flight requests on unmount to prevent stale state updates.
 * - Exposes `loading` and `error` flags for skeleton / error UI.
 *
 * @example
 * const { status, description, loading, error, refetch } = useSolanaStatus();
 */
export function useSolanaStatus(): UseSolanaStatusReturn {
  type State = {
    status: string;
    description: string;
    updatedAt: string | null;
    loading: boolean;
    error: boolean;
  };

  type Action =
    | { type: "start" }
    | {
        type: "success";
        payload: { status: string; description: string; updatedAt: string | null };
      }
    | { type: "error" };

  const [state, dispatch] = useReducer(
    (current: State, action: Action): State => {
      switch (action.type) {
        case "start":
          return { ...current, loading: true, error: false };
        case "success":
          return {
            status: action.payload.status,
            description: action.payload.description,
            updatedAt: action.payload.updatedAt,
            loading: false,
            error: false,
          };
        case "error":
          return { ...current, loading: false, error: true };
        default:
          return current;
      }
    },
    {
      status: "active",
      description: "All Systems Operational",
      updatedAt: null,
      loading: true,
      error: false,
    },
  );
  // Incrementing this triggers a re-fetch without changing the dep array shape.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "start" });

    fetch("https://status.solana.com/api/v2/status.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SolanaStatusResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        dispatch({
          type: "success",
          payload: {
            status: indicatorToStatus(data.status.indicator),
            description: data.status.description,
            updatedAt: data.page.updated_at,
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, refetch };
}

// ---------------------------------------------------------------------------
// ChainBadge
// ---------------------------------------------------------------------------

/** Props for {@link ChainBadge}. */
export interface ChainBadgeProps {
  /** Primary display name of the chain, e.g. `"Solana"`. */
  name: string;
  /** Secondary descriptor shown beneath the name, e.g. `"mainnet-beta"`. */
  chainId?: string;
  /** Icon element (SVG or `<img>`) rendered inside the coloured circle. */
  icon?: React.ReactNode;
  /**
   * Tailwind background class applied to the icon container.
   * @default "bg-neutral-100"
   */
  iconBg?: string;
  /**
   * Current chain/service status.
   * @default "active"
   */
  status?: "active" | "minor" | "major" | "critical" | "down" | (string & {});
  /** Round-trip latency in milliseconds, shown when provided. */
  latencyMs?: number;
  /**
   * Badge size variant.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | (string & {});
  /** Optional click handler attached to the badge button. */
  onClick?: () => void;
}

/**
 * A compact, interactive badge displaying a chain icon, name, optional
 * sub-label, a pulsing status dot, and an optional latency readout.
 *
 * Supports three size variants (`sm` | `md` | `lg`) and five status states
 * (`active` | `minor` | `major` | `critical` | `down`).
 *
 * @example
 * <ChainBadge
 *   name="Ethereum"
 *   chainId="0x1 · mainnet"
 *   status="active"
 *   latencyMs={18}
 *   size="md"
 * />
 */
export function ChainBadge({
  name,
  chainId,
  icon,
  iconBg = "bg-neutral-100",
  status = "active",
  latencyMs,
  size = "md",
  onClick,
}: ChainBadgeProps) {
  const s = STATUS[status] ?? STATUS.active;
  const z = SIZE[size] ?? SIZE.md;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-fit inline-flex items-center rounded-2xl overflow-hidden",
        "bg-white dark:bg-white/4",
        "border border-black/6 dark:border-white/8",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)]",
        "hover:-translate-y-px active:scale-[0.98]",
        "transition-[background-color,border-color,box-shadow,transform] duration-150",
        "cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-100/15 dark:focus-visible:ring-offset-black",
        z.badge,
      ].join(" ")}
      aria-label={`${name} status ${s.text}${chainId ? `, ${chainId}` : ""}`}
    >
      {/* Chain icon */}
      <span
        className={[
          "rounded-lg flex items-center justify-center shrink-0",
          iconBg,
          z.icon,
        ].join(" ")}
      >
        {icon}
      </span>

      {/* Name + chain ID */}
      <span className="flex flex-col items-start gap-px">
        <span
          className={[
            "font-medium text-neutral-900 dark:text-neutral-100 leading-tight whitespace-nowrap",
            z.name,
          ].join(" ")}
        >
          {name}
        </span>
        {chainId && (
          <span
            className={[
              "text-neutral-400 dark:text-neutral-500 leading-tight",
              z.sub,
            ].join(" ")}
          >
            {chainId}
          </span>
        )}
      </span>

      {/* Divider */}
      <span
        className={[
          "w-px shrink-0 bg-black/[0.07] dark:bg-white/8",
          z.divider,
        ].join(" ")}
      />

      {/* Status dot + label */}
      <span className="flex items-center gap-1.5 pr-0.5">
        {/* Dot container — fixed size so the pulse ring stays clipped inside. */}
        <span
          className={[
            "relative flex items-center justify-center shrink-0",
            z.dotWrap,
          ].join(" ")}
        >
          {/* Pulse ring — rendered only when animate is true. */}
          {s.animate && (
            <span
              className={[
                "absolute inset-0 rounded-full opacity-75 motion-reduce:opacity-35",
                s.ring,
                "motion-safe:animate-ping",
              ].join(" ")}
            />
          )}
          {/* Core filled dot */}
          <span
            className={[
              "rounded-full shrink-0 relative z-10",
              s.dot,
              z.dotCore,
            ].join(" ")}
          />
        </span>

        <span
          className={[
            "font-medium whitespace-nowrap",
            s.label,
            z.statusText,
          ].join(" ")}
        >
          {s.text}
        </span>
      </span>

      {/* Optional latency readout */}
      {latencyMs !== undefined && (
        <span
          className={[
            "text-neutral-400 dark:text-neutral-500",
            z.ms,
          ].join(" ")}
        >
          {status === "offline" ? "—" : `${latencyMs}ms`}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SolanaStatusBadge
// ---------------------------------------------------------------------------

/** Props for {@link SolanaStatusBadge}. */
export interface SolanaStatusBadgeProps {
  /**
   * Badge size variant forwarded to {@link ChainBadge}.
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | (string & {});
  /**
   * Optional click handler. Clicking the badge also re-triggers a status
   * fetch so the UI stays fresh without a full page reload.
   */
  onClick?: () => void;
}

/**
 * A zero-config badge that fetches live Solana network status from the
 * official Statuspage API and renders a {@link ChainBadge}.
 *
 * - Shows an animated skeleton while the first fetch is in-flight.
 * - Falls back to `"down"` state if the fetch fails.
 * - Clicking the badge triggers an immediate status refetch.
 *
 * @example
 * // Minimal usage — fetches and renders automatically.
 * <SolanaStatusBadge />
 *
 * @example
 * // With size and click callback.
 * <SolanaStatusBadge size="lg" onClick={() => console.log("refreshed")} />
 */
export function SolanaStatusBadge({ size = "md", onClick }: SolanaStatusBadgeProps) {
  const { status, description, updatedAt, loading, error, refetch } = useSolanaStatus();
  const subtitle = useMemo(() => {
    if (error) return "Tap to retry";
    if (!updatedAt) return description;

    const time = new Date(updatedAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${description} · ${time}`;
  }, [description, error, updatedAt]);

  /** Re-fetches status and calls the optional external click handler. */
  const handleClick = useCallback(() => {
    refetch();
    onClick?.();
  }, [refetch, onClick]);

  // Render an animated skeleton while the initial fetch is in-flight.
  if (loading) {
    const z = SIZE[size] ?? SIZE.md;
    return (
      <div
        className={[
          "w-36 inline-flex items-center rounded-2xl",
          "bg-neutral-100 dark:bg-white/4",
          "border border-black/6 dark:border-white/8",
          z.badge,
          z.skeletonH,
          "motion-safe:animate-pulse",
        ].join(" ")}
      />
    );
  }

  return (
    <ChainBadge
      name="Solana"
      chainId={subtitle}
      icon={<SolanaLogoMark />}
      iconBg="bg-neutral-950"
      status={error ? "down" : status}
      size={size}
      onClick={handleClick}
    />
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Inline SVG of the official Solana logo mark (three angled parallelogram
 * bars with Solana's brand gradient).
 *
 * Rendered at `w-full h-full` so it fills whatever icon container it sits in.
 *
 * @internal
 */
function SolanaLogoMark() {
  return (
    <svg
      viewBox="0 0 397 311"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full p-1.5"
      aria-label="Solana logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="sol-a"
          x1="198.56" y1="316.99"
          x2="59.79"  y2="-22.99"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0"   stopColor="#9945ff" />
          <stop offset=".14" stopColor="#8752f3" />
          <stop offset=".42" stopColor="#5497d5" />
          <stop offset=".68" stopColor="#43b4ca" />
          <stop offset=".82" stopColor="#28e0b9" />
          <stop offset="1"   stopColor="#19fb9b" />
        </linearGradient>
        <linearGradient
          id="sol-b"
          x1="237.29" y1="335.76"
          x2="98.52"  y2="-4.22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0"   stopColor="#9945ff" />
          <stop offset=".14" stopColor="#8752f3" />
          <stop offset=".42" stopColor="#5497d5" />
          <stop offset=".68" stopColor="#43b4ca" />
          <stop offset=".82" stopColor="#28e0b9" />
          <stop offset="1"   stopColor="#19fb9b" />
        </linearGradient>
        <linearGradient
          id="sol-c"
          x1="218.04" y1="326.38"
          x2="79.27"  y2="-13.6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0"   stopColor="#9945ff" />
          <stop offset=".14" stopColor="#8752f3" />
          <stop offset=".42" stopColor="#5497d5" />
          <stop offset=".68" stopColor="#43b4ca" />
          <stop offset=".82" stopColor="#28e0b9" />
          <stop offset="1"   stopColor="#19fb9b" />
        </linearGradient>
      </defs>
      {/* Bottom bar */}
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#sol-a)"
      />
      {/* Top bar */}
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#sol-b)"
      />
      {/* Middle bar */}
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#sol-c)"
      />
    </svg>
  );
}
