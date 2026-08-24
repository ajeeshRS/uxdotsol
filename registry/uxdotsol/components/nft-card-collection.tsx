"use client";

/**
 * @file NFTCollectionCard — a card that represents an entire NFT collection,
 * featuring a banner / logo layout, floor price, 24h volume, and an animated
 * flip-expand modal that surfaces individual items for sale.
 *
 * The modal uses a morphing-box animation: the card's DOM rect is captured on
 * click, and the modal box is CSS-transitioned from those exact dimensions to
 * the final full-screen size, creating a seamless expansion effect. The inner
 * panel flips 180° along the Y-axis to reveal the detail view.
 *
 * @module uxdotsol/components/nft-card-collection
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { NFTCard } from "./nft-card";


/* ─────────────────────────────────────────────────────────────────────────────
   TILT SYSTEM
───────────────────────────────────────────────────────────────────────────── */
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

const useMouseEnter = (): [boolean, boolean] => {
  const context = useContext(MouseEnterContext);
  return context ? [context[0], context[2]] : [false, false];
};

function TiltContainer({
  children,
  className = "",
  disabled = false,
  intensity = 25,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  intensity?: number;
}) {
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
}

function TiltItem({
  children,
  className = "",
  translateZ = 0,
}: {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
    <div
      ref={ref}
      className={className}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────────────────────────────────────── */
// ---------------------------------------------------------------------------
// Shared SVG primitives
// ---------------------------------------------------------------------------

/**
 * Blue verified badge rendered next to verified collection names.
 * @internal
 */
function VerifiedBadge({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="10" className="fill-blue-500" />
      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Tiny up/down chevron arrow used in the floor-price change badge.
 * Rotated 180 ° when `up` is `false`.
 * @internal
 */
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: up ? "none" : "rotate(180deg)", flexShrink: 0 }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

interface CollectionItem {
  id?: string | number;
  image: string;
  name: string;
  collection?: string;
  verified?: boolean;
  price?: string;
  priceSymbol?: string;
  likes?: number;
  ownerName?: string;
  ownerAvatar?: string;
}

interface CollectionData {
  bannerImage: string;
  logoImage: string;
  name: string;
  verified?: boolean;
  description?: string;
  itemCount?: number;
  ownerCount?: number;
  floorPrice?: string;
  priceSymbol?: string;
  volume24h?: string;
  floorChange?: number;
  items?: CollectionItem[];
}


// ---------------------------------------------------------------------------
// FlipModal
// ---------------------------------------------------------------------------

/**
 * An animated modal that morphs from the collection card's bounding box into
 * a full-screen overlay. The inner panel performs a 180 ° Y-axis flip to
 * reveal the detail / items-for-sale view after the expand transition.
 *
 * @param col      - The collection data object (passed directly from the card).
 * @param cardRect - The `DOMRect` of the card at the time the modal was opened,
 *                   used as the animation start position.
 * @param onClose  - Callback invoked after the collapse animation completes.
 *
 * @internal
 */
function FlipModal({
  col,
  cardRect,
  onClose,
}: {
  col: CollectionData;
  cardRect: DOMRect | null;
  onClose: () => void;
}) {
  type ModalPhase =
    | "opening-morph"
    | "opening-flip"
    | "open"
    | "closing-flip"
    | "closing-morph";

  const [phase, setPhase] = useState<ModalPhase>("opening-morph");
  const [finalSize, setFinalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [morphStarted, setMorphStarted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  // === SCROLL LOCK (native) ===
  // Locks the page scroll while the modal is open and restores previous
  // overflow state — including a scrollbar-width padding to prevent layout shift.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPadding  = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPadding;
    };
  }, []); // runs once on mount / cleans up on unmount

  // The fixed final box is measured independently from its compositor transform.
  // Re-measure only on mount and viewport resize, never during animation frames.
  useLayoutEffect(() => {
    const measureFinalBox = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const nextSize = {
        width: dialog.offsetWidth,
        height: dialog.offsetHeight,
      };
      setFinalSize(nextSize);
    };

    measureFinalBox();
    window.addEventListener("resize", measureFinalBox);
    return () => window.removeEventListener("resize", measureFinalBox);
  }, []);

  const viewportCenterX = typeof window === "undefined" ? 0 : window.innerWidth / 2;
  const viewportCenterY = typeof window === "undefined" ? 0 : window.innerHeight / 2;
  const deltaX = cardRect
    ? cardRect.left + cardRect.width / 2 - viewportCenterX
    : 0;
  const deltaY = cardRect
    ? cardRect.top + cardRect.height / 2 - viewportCenterY
    : 0;
  const scaleX = cardRect && finalSize ? cardRect.width / finalSize.width : 1;
  const scaleY = cardRect && finalSize ? cardRect.height / finalSize.height : 1;
  const expandedTransform =
    "translate(-50%, -50%) translate(0px, 0px) scale(1, 1)";
  const collapsedTransform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;

  // Open sequence: morph → flip → show content. The initial rAF starts the
  // first compositor transition while the phase remains the single sequencer.
  useEffect(() => {
    if (!finalSize || phase !== "opening-morph") return;
    if (!reduceMotion && morphStarted) return;
    const frame = window.requestAnimationFrame(() => {
      if (reduceMotion) {
        setPhase("open");
      } else {
        setMorphStarted(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [finalSize, morphStarted, phase, reduceMotion]);

  // Close sequence — prevents flip glitch
  // rule: advanced-event-handler-refs — store handleClose in a ref so the
  // Escape-key effect never needs to re-register (stable dep array = []).
  const handleCloseRef = useRef<() => void>(() => {});

  const handleClose = useCallback(() => {
    if (phase === "closing-flip" || phase === "closing-morph") return;
    if (reduceMotion) {
      setPhase("closing-morph");
      return;
    }
    if (phase === "opening-morph" && !morphStarted) {
      onClose();
      return;
    }

    // Nothing has flipped during the opening morph, so collapse immediately.
    setPhase(phase === "opening-morph" ? "closing-morph" : "closing-flip");
  }, [morphStarted, onClose, phase, reduceMotion]);

  const handleMorphTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (
        event.target !== event.currentTarget ||
        event.propertyName !== (reduceMotion ? "opacity" : "transform")
      ) {
        return;
      }

      if (phase === "opening-morph") {
        setPhase("opening-flip");
      } else if (phase === "closing-morph") {
        onClose();
      }
    },
    [onClose, phase, reduceMotion],
  );

  const handleFlipTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (
        event.target !== event.currentTarget ||
        event.propertyName !== "transform"
      ) {
        return;
      }

      if (phase === "opening-flip") {
        setPhase("open");
      } else if (phase === "closing-flip") {
        setPhase("closing-morph");
      }
    },
    [phase],
  );

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseRef.current();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      previouslyFocusedRef.current?.focus();
    };
  }, []); // stable — no deps needed

  if (!col || !cardRect) return null;

  const morphExpanded = phase !== "closing-morph";
  const isFlipped = phase === "opening-flip" || phase === "open";
  const showContent = phase === "open";
  const morphTransform = reduceMotion
    ? expandedTransform
    : morphExpanded && morphStarted
      ? expandedTransform
      : collapsedTransform;
  const morphStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    width: "min(880px, 92vw)",
    height: "min(700px, 90vh)",
    transform: morphTransform,
    transformOrigin: "center",
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close collection details"
        onClick={handleClose}
        className="fixed inset-0"
        style={{
          zIndex: 200,
          background: "rgba(0,0,0,0.68)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity:
            reduceMotion
              ? phase === "open"
                ? 1
                : 0
              : morphExpanded && morphStarted
                ? 1
                : 0,
          pointerEvents: phase === "closing-morph" ? "none" : "auto",
          transition: `opacity 200ms ${reduceMotion ? "ease" : "cubic-bezier(0.23, 1, 0.32, 1)"}`,
        }}
      />

      {/* Morphing box */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onTransitionEnd={handleMorphTransitionEnd}
        className="fixed overscroll-contain outline-none"
        style={{
          zIndex: 201,
          ...morphStyle,
          perspective: "1200px",
          visibility: finalSize ? "visible" : "hidden",
          opacity:
            reduceMotion &&
            (phase === "opening-morph" || phase === "closing-morph")
              ? 0
              : 1,
          transitionProperty: reduceMotion ? "opacity" : "transform",
          transitionDuration: reduceMotion
            ? "200ms"
            : phase === "closing-morph"
              ? "220ms"
              : "280ms",
          transitionTimingFunction: reduceMotion
            ? "ease"
            : "cubic-bezier(0.23, 1, 0.32, 1)",
          willChange:
            phase === "opening-morph" || phase === "closing-morph"
              ? reduceMotion
                ? "opacity"
                : "transform"
              : undefined,
        }}
      >
        {/* Flip card inner */}
        <div
          onTransitionEnd={handleFlipTransitionEnd}
          className="transition-transform duration-[520ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            borderRadius: "20px",
          }}
        >
          {/* ── FRONT ── */}
          <div
            style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "20px",
              overflow: "hidden",
            }}
            className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/8"
          >
            <div className="relative h-2/5 overflow-hidden">
              <img src={col.bannerImage} alt={col.name} width={880} height={280} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white dark:to-[#111113]" />
            </div>
            <div className="px-5 pt-4 pb-5">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white dark:border-[#111113] shadow-md shrink-0">
                  <img src={col.logoImage} alt={col.name} width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[16px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{col.name}</span>
                    {col.verified && <VerifiedBadge />}
                  </div>
                  {col.itemCount !== undefined && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {col.itemCount.toLocaleString()} items
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "20px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/8"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-white/6 shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/8 shrink-0">
                <img src={col.logoImage} alt={col.name} width={36} height={36} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span id={titleId} className="text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{col.name}</span>
                  {col.verified && <VerifiedBadge size={12} />}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {[
                    col.itemCount !== undefined && `${col.itemCount.toLocaleString()} items`,
                    col.ownerCount !== undefined && `${col.ownerCount >= 1000 ? `${(col.ownerCount / 1000).toFixed(1)}k` : col.ownerCount} owners`,
                  ].filter(Boolean).join(" · ")}
                </span>
              </div>


              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close collection details"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-[#27272a] transition-colors duration-150 cursor-pointer"
              >
                <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Description */}
            {col.description && (
              <div className="px-5 pt-3.5 shrink-0">
                <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {col.description}
                </p>
              </div>
            )}

            {/* Section label */}
            <div className="px-5 pt-3.5 pb-2 shrink-0 ">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Items for sale
                </span>
                {col.items?.length ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold">
                    {col.items.length}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Scrollable items grid */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-5 relative"
            >                 
              <div
                className="grid gap-3 md:grid-cols-3 pt-3"
              >
               
                {(col.items || []).length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center dark:border-white/8 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      No items listed yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Check back later for live listings from this collection.
                    </p>
                  </div>
                ) : null}
                {(col.items || []).map((nft: CollectionItem, idx: number) => (
                  <div

                    key={nft.id || idx}
                    style={{
                      opacity: showContent ? 1 : 0,
                      transform: showContent ? "translateY(0)" : "translateY(8px)",
                      transition: `opacity 0.25s ease ${Math.min(0.04 * idx, 0.3)}s, transform 0.25s ease ${Math.min(0.04 * idx, 0.3)}s`,
                    }}
                  >
                    <NFTCard
                      image={nft.image}
                      name={nft.name}
                      collection={nft.collection || col.name}
                      verified={nft.verified ?? col.verified}
                      price={nft.price}
                      priceSymbol={nft.priceSymbol || col.priceSymbol}
                      likes={nft.likes}
                      ownerName={nft.ownerName}
                      ownerAvatar={nft.ownerAvatar}
                      onBuy={()=>{}}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}




/* ─────────────────────────────────────────────────────────────────────────────
   NFT COLLECTION CARD 
───────────────────────────────────────────────────────────────────────────── */
export interface NFTCollectionCardProps {
  bannerImage: string;
  logoImage: string;
  name: string;
  verified?: boolean;
  description?: string;
  itemCount?: number;
  ownerCount?: number;
  floorPrice?: string;
  priceSymbol?: string;
  volume24h?: string;
  floorChange?: number;
  href?: string;
  tilt?: boolean;
  tiltIntensity?: number;
  onExplore?: () => void;
  items?: CollectionItem[];
  className?: string;
}

/**
 * Displays a summary card for an NFT collection with a banner-and-logo header,
 * floor price, 24h change badge, trading volume, and an "Explore" button.
 *
 * Clicking the card triggers an animated `FlipModal` that expands from the
 * card's bounding rect and flips open to reveal individual NFT items for sale.
 *
 * @param props - {@link NFTCollectionCardProps}
 *
 * @example
 * <NFTCollectionCard
 *   bannerImage="/banner.jpg"
 *   logoImage="/logo.png"
 *   name="DeGods"
 *   verified
 *   floorPrice="24.5"
 *   floorChange={3.2}
 *   volume24h="1200"
 *   items={nftsArray}
 *   tilt
 * />
 */
export function NFTCollectionCard({
  bannerImage,
  logoImage,
  name,
  verified = false,
  description,
  itemCount,
  ownerCount,
  floorPrice,
  priceSymbol = "SOL",
  volume24h,
  floorChange,
  href,
  tilt = false,
  tiltIntensity = 28,
  onExplore,
  items,
  className = "",
}: NFTCollectionCardProps) {
  /** `true` when `floorChange` is ≥ 0 (used to theme the change badge). */
  const isUp = floorChange !== undefined && floorChange >= 0;
  /** Whether the card is currently hovered (drives lift / shadow effect). */
  const [hover, setHover] = useState(false);
  const tiltDisabled = useTiltDisabled();
  /** Whether the `FlipModal` is currently mounted. */
  const [modalOpen, setModalOpen] = useState(false);
  /** The card's `DOMRect` at the time the modal was opened. */
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  /** Ref to the card element — used to capture its bounding rect on click. */
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Captures the card's current bounding rect and opens the `FlipModal`.
   * The rect is used as the animation start position so the modal appears
   * to "grow out" of the exact card position.
   */
  const handleOpen = useCallback(() => {
    if (cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect());
      setModalOpen(true);
    }
  }, []);

  /** Stable setter passed to `onMouseEnter` to avoid inline arrow re-creation. */
  const handleMouseEnter = useCallback(() => setHover(true), []);
  /** Stable setter passed to `onMouseLeave`. */
  const handleMouseLeave = useCallback(() => setHover(false), []);
  /** Stable callback passed to `FlipModal.onClose` to avoid prop object churn. */
  const handleModalClose = useCallback(() => setModalOpen(false), []);
  // rule: rerender-memo-with-default-value — build col object once with useMemo
  // to avoid passing a new object reference to FlipModal on every render.
  const colData = useMemo(
    () => ({ bannerImage, logoImage, name, verified, description, itemCount, ownerCount, floorPrice, priceSymbol, volume24h, floorChange, items }),
    [bannerImage, logoImage, name, verified, description, itemCount, ownerCount, floorPrice, priceSymbol, volume24h, floorChange, items],
  );

  const cardInner = (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-70 rounded-2xl overflow-hidden bg-white dark:bg-[#111113] border cursor-pointer transition-[border-color,box-shadow,transform] duration-200 focus-within:ring-2 focus-within:ring-zinc-950/10 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-zinc-50/15 dark:focus-within:ring-offset-[#111113] ${hover && !tilt ? "-translate-y-1" : ""} ${className}`}
      style={{
        borderColor: hover ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)",
        boxShadow: hover
          ? "0 8px 28px rgba(0,0,0,0.32)"
          : "0 2px 12px rgba(0,0,0,0.18)",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
      }}
    >
      <TiltItem translateZ={tilt ? 30 : 0} className="relative z-20 pointer-events-none">
        <div className="relative w-full h-30 overflow-hidden">
          <img
            src={bannerImage}
            alt={`${name} banner`}
            width={560}
            height={240}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{
              transform: hover && !tiltDisabled ? "scale(1.05)" : "scale(1)",
              transition: tiltDisabled
                ? "none"
                : "transform 180ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/70 dark:to-[#111113]/90" />
          {/* rule: rendering-conditional-render — ternary not && */}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${name} website`}
              className="pointer-events-auto absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : null}
        </div>
      </TiltItem>

      <TiltItem translateZ={tilt ? 20 : 0} className="relative z-20 pointer-events-none">
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-3 -mt-5">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white dark:border-[#111113] shadow-sm shrink-0 bg-white dark:bg-[#111113]" style={{ zIndex: 2 }}>
              <img src={logoImage} alt={name} width={48} height={48} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{name}</h3>
                {/* rule: rendering-conditional-render — ternary not && */}
                {verified ? <VerifiedBadge size={12} /> : null}
              </div>
              {/* rule: rendering-conditional-render — ternary not && */}
              {itemCount !== undefined ? (
                <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span className="text-[11px]">{itemCount.toLocaleString()} items</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* rule: rendering-conditional-render — ternary not && */}
          {description ? (
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {description}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                Floor
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[14px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {floorPrice ?? "—"}
                </span>
                {floorPrice ? (
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {priceSymbol}
                  </span>
                ) : null}
              </div>
              {floorChange !== undefined ? (
                <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isUp
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                }`}>
                  <TrendArrow up={isUp} />
                  {Math.abs(floorChange).toFixed(1)}%
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                Volume 24h
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[14px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {volume24h ?? "—"}
                </span>
                {volume24h ? (
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {priceSymbol}
                  </span>
                ) : null}
              </div>
              {ownerCount !== undefined ? (
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {ownerCount >= 1000 ? `${(ownerCount / 1000).toFixed(1)}k` : ownerCount} owners
                </p>
              ) : null}
            </div>
          </div>

          {/* rule: rendering-conditional-render — ternary not && */}
          {onExplore ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onExplore(); }}
              className="pointer-events-auto relative z-20 w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:opacity-80 active:scale-[0.97] text-white dark:text-zinc-900 text-[13px] font-semibold tracking-tight transition-[background-color,color,opacity,transform,box-shadow] duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
            >
              Explore collection
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : null}
        </div>
      </TiltItem>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Open ${name} collection details`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none"
      />
    </div>
  );

  return (
    <>
      {tilt ? (
        <TiltContainer intensity={tiltIntensity} disabled={tiltDisabled}>
          {cardInner}
        </TiltContainer>
      ) : (
        cardInner
      )}
      {/* rule: rendering-conditional-render — ternary not && */}
      {modalOpen ? (
        <FlipModal
          col={colData}
          cardRect={cardRect}
          onClose={handleModalClose}
        />
      ) : null}
    </>
  );
}
