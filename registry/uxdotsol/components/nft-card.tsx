"use client";

/**
 * @file NFTCard — a rich NFT display card with optional 3D mouse-tilt effect,
 * like/favourite toggle, external marketplace link, owner info, and a buy button.
 *
 * The 3D tilt system is built around a React context so that nested elements
 * (`TiltItem`) can independently respond to the parent container's mouse state
 * without prop-drilling.
 *
 * @module uxdotsol/components/nft-card
 */

import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Heart, ExternalLink, Tag } from "lucide-react";

// ---------------------------------------------------------------------------
// Tilt system — context + primitives
// ---------------------------------------------------------------------------

/**
 * Shared context for the 3D tilt system. Provides `[isMouseEntered, setter]`
 * from `TiltContainer` down to all `TiltItem` children without prop-drilling.
 *
 * @internal
 */
const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean] | undefined
>(undefined);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(hover: none), (pointer: coarse)";

function subscribeToTiltPreference(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const queries = [
    window.matchMedia(REDUCED_MOTION_QUERY),
    window.matchMedia(COARSE_POINTER_QUERY),
  ];

  queries.forEach((query) => query.addEventListener("change", onStoreChange));
  return () => {
    queries.forEach((query) =>
      query.removeEventListener("change", onStoreChange),
    );
  };
}

function getTiltDisabledSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia(REDUCED_MOTION_QUERY).matches ||
    window.matchMedia(COARSE_POINTER_QUERY).matches
  );
}

function useTiltDisabled() {
  return useSyncExternalStore(
    subscribeToTiltPreference,
    getTiltDisabledSnapshot,
    () => false,
  );
}

/**
 * Reads the `isMouseEntered` flag from the nearest `TiltContainer`.
 * Falls back to `false` when called outside a provider, so `TiltItem` can
 * safely be rendered in a non-tilt context.
 *
 * @internal
 */
const useMouseEnter = (): [boolean, boolean] => {
  const context = useContext(MouseEnterContext);
  return context ? [context[0], context[2]] : [false, false];
};

/** Props for the `TiltContainer` internal component. @internal */
interface TiltContainerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /**
   * Tilt divisor. A **higher** value produces a **subtler** rotation angle.
   * @default 25
   */
  intensity?: number;
}

/**
 * Sets a CSS 3D perspective context and calculates real-time `rotateX` /
 * `rotateY` transforms from mouse position, publishing the hover state via
 * `MouseEnterContext` so nested `TiltItem` elements can independently offset
 * their `translateZ`.
 *
 * Memoised to prevent the perspective wrapper from re-rendering when an
 * ancestor component re-renders.
 *
 * @internal
 */
const TiltContainer = memo(function TiltContainer({
  children,
  className = "",
  disabled = false,
  intensity = 25,
}: TiltContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const refreshBounds = useCallback(() => {
    if (!trackingRef.current || !containerRef.current) return;
    boundsRef.current = containerRef.current.getBoundingClientRect();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", refreshBounds);
    window.addEventListener("scroll", refreshBounds, true);
    return () => {
      window.removeEventListener("resize", refreshBounds);
      window.removeEventListener("scroll", refreshBounds, true);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [refreshBounds]);

  useEffect(() => {
    if (!disabled || !containerRef.current) return;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    containerRef.current.style.transition = "none";
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, [disabled]);

  const handlePointerEnter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    trackingRef.current = true;
    boundsRef.current = container.getBoundingClientRect();
    container.style.transition = "none";
    setIsMouseEntered(!disabled);
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !trackingRef.current || !boundsRef.current) return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const container = containerRef.current;
      const bounds = boundsRef.current;
      if (!container || !bounds || !trackingRef.current) return;

      const rotateY =
        (pointerRef.current.x - bounds.left - bounds.width / 2) / intensity;
      const rotateX =
        -(pointerRef.current.y - bounds.top - bounds.height / 2) / intensity;
      container.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });
  }, [disabled, intensity]);

  const handlePointerLeave = useCallback(() => {
    const container = containerRef.current;
    trackingRef.current = false;
    boundsRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setIsMouseEntered(false);
    if (!container) return;
    container.style.transition = disabled
      ? "none"
      : "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)";
    container.style.transform = "rotateY(0deg) rotateX(0deg)";
  }, [disabled]);

  return (
    <MouseEnterContext.Provider
      value={[isMouseEntered && !disabled, setIsMouseEntered, disabled]}
    >
      <div style={{ perspective: "1000px" }}>
        <div
          ref={containerRef}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className={`relative ${className}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
});

/** Props for the `TiltItem` internal component. @internal */
interface TiltItemProps {
  children: React.ReactNode;
  className?: string;
  /**
   * How many pixels the element should extrude toward the viewer along the
   * Z-axis when the parent `TiltContainer` is hovered.
   * @default 0
   */
  translateZ?: number;
}

/**
 * An element that floats at a given `translateZ` depth when its parent
 * `TiltContainer` detects pointer hover. Uses a DOM ref write (not state) for
 * the transform so it doesn't trigger a React re-render on every frame.
 *
 * Safe to render outside a `TiltContainer` — falls back to `translateZ(0px)`
 * via the `useMouseEnter` hook's default value of `false`.
 *
 * @internal
 */
const TiltItem = memo(function TiltItem({ children, className = "", translateZ = 0 }: TiltItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  /** Safely reads `isMouseEntered`; returns `false` outside a provider. */
  const [isMouseEntered, disabled] = useMouseEnter();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.transition = disabled || isMouseEntered
      ? "none"
      : "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)";
    ref.current.style.transform = !disabled && isMouseEntered
      ? `translateZ(${translateZ}px)`
      : "translateZ(0px)";
  }, [disabled, isMouseEntered, translateZ]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
});

// ---------------------------------------------------------------------------
// NFTCard
// ---------------------------------------------------------------------------

/**
 * Public props for the {@link NFTCard} component.
 */
export interface NFTCardProps {
  /** URL of the NFT artwork image. */
  image: string;
  /** Display name / title of the NFT. */
  name: string;
  /** Name of the collection this NFT belongs to. */
  collection?: string;
  /** When `true`, renders a blue verified checkmark next to the collection name. */
  verified?: boolean;
  /** Listing price as a formatted string (e.g. `"1.5"`). Omit if not listed. */
  price?: string;
  /** Token symbol for the price (e.g. `"SOL"`, `"ETH"`). @default "SOL" */
  priceSymbol?: string;
  /** Label for the last sale price (e.g. `"1.2 SOL"`). */
  lastSale?: string;
  /** URL of the owner / creator avatar image. */
  ownerAvatar?: string;
  /** Display name of the owner or creator. */
  ownerName?: string;
  /** Initial like / favourite count displayed on the artwork overlay. */
  likes?: number;
  /** URL to the NFT on an external marketplace. Renders an icon button on the artwork. */
  href?: string;
  /** Enables the interactive 3D mouse-tilt effect. @default false */
  tilt?: boolean;
  /**
   * Tilt divisor — a **higher** value produces a **subtler** rotation.
   * @default 28
   */
  tiltIntensity?: number;
  /** Callback fired when the "Buy now" action button is clicked. */
  onBuy?: () => void;
  /** Optional Tailwind / CSS class applied to the card root element. */
  className?: string;
}

/**
 * A polished NFT display card suitable for gallery and marketplace layouts.
 *
 * Features:
 * - Artwork image with hover zoom
 * - Like / favourite toggle with animated count
 * - Optional external marketplace link
 * - Owner row (avatar + name)
 * - Price section with last-sale subtext or "Not listed" state
 * - "Buy now" action button (rendered only when `price` and `onBuy` are provided)
 * - Optional 3D mouse-tilt effect via `TiltContainer` / `TiltItem`
 *
 * @param props - {@link NFTCardProps}
 *
 * @example
 * <NFTCard
 *   image="/nft.jpg"
 *   name="Degen #1234"
 *   collection="DeGods"
 *   verified
 *   price="24.5"
 *   likes={142}
 *   tilt
 *   onBuy={() => openBuyModal()}
 * />
 */
export function NFTCard({
  image,
  name,
  collection,
  verified = false,
  price,
  priceSymbol = "SOL",
  lastSale,
  ownerAvatar,
  ownerName,
  likes,
  href,
  tilt = false,
  tiltIntensity = 28,
  onBuy,
  className = "",
}: NFTCardProps) {
  /** Whether this user has liked the NFT in this session. */
  const [liked, setLiked] = useState(false);
  /** Current displayed like count (initialised from the `likes` prop). */
  const [likeCount, setLikeCount] = useState(likes ?? 0);
  const tiltDisabled = useTiltDisabled();

  /**
   * Toggles the liked state and increments / decrements the count.
   * Uses the functional `setState` form so the count always derives from the
   * previous value, avoiding stale closure bugs when the callback is reused.
   */
  const toggleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => {
      setLikeCount((prevCount) => (prev ? prevCount - 1 : prevCount + 1));
      return !prev;
    });
  }, []);

  // Artwork section — only wrapped in TiltItem when tilt is enabled
  const artwork = (
    <div className="relative w-full aspect-square overflow-hidden group">
      <img
        src={image}
        alt={name}
        className={`object-cover w-full h-full ${
          tiltDisabled ? "" : "group-hover:[transform:scale(1.05)]"
        }`}
        style={{
          transform: tiltDisabled ? "scale(1)" : undefined,
          transition: tiltDisabled
            ? "none"
            : "transform 180ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <button
        type="button"
        onClick={toggleLike}
        aria-label={liked ? "Unlike" : "Like"}
        aria-pressed={liked}
        className="absolute top-3 right-3 flex min-h-10 items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 dark:bg-black/50 backdrop-blur-md hover:bg-black/50 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Heart
          size={13}
          className={liked ? "text-red-400 fill-red-400" : "text-white/80"}
        />
        {/* rule: rendering-conditional-render — ternary not && */}
        {likes !== undefined ? (
          <span className="text-[11px] font-semibold text-white/80 tabular-nums">
            {likeCount}
          </span>
        ) : null}
      </button>
      {/* rule: rendering-conditional-render — ternary not && */}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-black/30 dark:bg-black/50 backdrop-blur-md hover:bg-black/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Open NFT marketplace page"
        >
          <ExternalLink size={13} className="text-white/80" />
        </a>
      ) : null}
    </div>
  );

  // Body section — shared between both modes
  const body = (
    <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
      {/* Collection + name */}
      <div className="flex flex-col gap-0.5">
        {collection && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide truncate">
              {collection}
            </span>
            {verified && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="12" r="10" className="fill-blue-500" />
                <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
        <h3 className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
          {name}
        </h3>
      </div>

      {/* Owner row */}
      {(ownerName || ownerAvatar) && (
        <div className="flex items-center gap-2">
          {ownerAvatar ? (
            <img
              src={ownerAvatar}
              alt={ownerName ?? "Owner"}
              width={20}
              height={20}
              className="rounded-full border border-zinc-200 dark:border-white/10"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          )}
          <span className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
            {ownerName}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-zinc-100 dark:bg-white/6" />

      {/* Price row + buy button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          {price ? (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Price
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                  {price}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {priceSymbol}
                </span>
              </div>
              {lastSale && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                  Last: {lastSale}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <Tag size={12} />
              <span className="text-[12px]">Not listed</span>
            </div>
          )}
        </div>

        {onBuy && price && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onBuy(); }}
            className="shrink-0 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:opacity-80 active:scale-[0.97] text-white dark:text-zinc-900 text-[13px] font-semibold tracking-tight transition-[background-color,color,opacity,transform,box-shadow] duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
          >
            Buy now
          </button>
        )}
      </div>
    </div>
  );

  const cardInner = (
    <div
      className={`
        relative w-70 rounded-2xl overflow-hidden
        bg-white dark:bg-[#111113]
        border border-zinc-200 dark:border-white/8
        shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        transition-shadow duration-300
        hover:shadow-md dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.55)]
        ${className}
      `}
    >
      {tilt ? (
        <>
          <TiltItem translateZ={30}>{artwork}</TiltItem>
          <TiltItem translateZ={20}>{body}</TiltItem>
        </>
      ) : (
        <>
          {artwork}
          {body}
        </>
      )}
    </div>
  );

  if (tilt) {
    return (
      <TiltContainer intensity={tiltIntensity} disabled={tiltDisabled}>
        {cardInner}
      </TiltContainer>
    );
  }

  return cardInner;
}
