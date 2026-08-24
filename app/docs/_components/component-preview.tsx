"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EASE_OUT } from "@/lib/motion";

import { componentPreviews } from "./previews/components";
import { flowPreviews } from "./previews/flows";
import { hookPreviews } from "./previews/hooks";
import { templatePreviews } from "./previews/templates";

const previewMap = {
  ...componentPreviews,
  ...hookPreviews,
  ...flowPreviews,
  ...templatePreviews,
};

export function ComponentPreview({
  slug,
  allowFullscreen = false,
}: {
  slug: string;
  allowFullscreen?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenOrigin, setFullscreenOrigin] = useState<DOMRect | null>(null);
  const embeddedPreviewRef = useRef<HTMLDivElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const exitFullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFullscreenFocusRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const isFullscreen = allowFullscreen && isExpanded;
  const isHookPreview = slug.startsWith("use-");
  const isFlowPreview = slug.endsWith("-flow");
  const isTemplatePreview = [
    "private-transfer",
    "spl-token-transfer",
    "merchant-checkout",
    "payment-tracking-receipt",
    "mobile-wallet-payment",
  ].includes(slug);
  const isAuthPreview = slug === "sign-in-with-solana";
  const isCheckoutPreview = slug === "solana-pay-checkout";
  const isReviewPreview = slug === "transaction-review";
  const isRecipientPreview = slug === "safe-recipient-field";
  const isTokenSafetyPreview = slug === "token-safety-disclosure";
  const isLifecyclePreview = slug === "transaction-lifecycle";
  const isReceiptPreview = slug === "transaction-receipt";
  const isProgressTimelinePreview = slug === "transaction-progress-timeline";
  const isFeeEstimatePreview = slug === "fee-estimate";
  const isCoinPricePreview = slug === "coin-price";
  const isLargePreview =
    isFlowPreview ||
    isTemplatePreview ||
    isAuthPreview ||
    isCheckoutPreview ||
    isReviewPreview ||
    isRecipientPreview ||
    isTokenSafetyPreview ||
    isLifecyclePreview ||
    isReceiptPreview ||
    isProgressTimelinePreview ||
    isFeeEstimatePreview ||
    isHookPreview;

  useEffect(() => {
    if (!fullscreenOrigin) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreenOrigin]);

  useEffect(() => {
    if (isFullscreen) exitFullscreenButtonRef.current?.focus();
  }, [isFullscreen]);

  useEffect(() => {
    if (fullscreenOrigin || !restoreFullscreenFocusRef.current) return;

    restoreFullscreenFocusRef.current = false;
    fullscreenButtonRef.current?.focus();
  }, [fullscreenOrigin]);

  const preview = previewMap[slug];

  const openFullscreen = () => {
    const origin = embeddedPreviewRef.current?.getBoundingClientRect();
    if (!origin) return;

    setFullscreenOrigin(origin);
    setIsExpanded(true);
  };

  const collapsedTransform =
    fullscreenOrigin && typeof window !== "undefined"
      ? `translate(${fullscreenOrigin.left}px, ${fullscreenOrigin.top}px) scale(${fullscreenOrigin.width / window.innerWidth}, ${fullscreenOrigin.height / window.innerHeight})`
      : "translate(0px, 0px) scale(1, 1)";

  if (!preview) {
    return (
      <div className="flex w-full items-center justify-center rounded-[30px] border border-dashed border-[#eaeaea] p-10 text-neutral-400 dark:border-[#1c1c1c] dark:text-neutral-600">
        Preview not available
      </div>
    );
  }

  if (allowFullscreen) {
    return (
      <>
        <div
          ref={embeddedPreviewRef}
          aria-hidden={Boolean(fullscreenOrigin) || undefined}
          inert={Boolean(fullscreenOrigin)}
          className="relative flex min-h-90 items-center justify-center overflow-hidden rounded-[30px] border border-[#f4f4f4] bg-white p-5 dark:border-[#141414] dark:bg-neutral-950 sm:p-6"
        >
          <div className="flex min-h-75 w-full items-center justify-center rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] p-4 dark:bg-black">
            <button
              ref={fullscreenButtonRef}
              type="button"
              onClick={openFullscreen}
              disabled={Boolean(fullscreenOrigin)}
              aria-expanded={isFullscreen}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
              View preview
            </button>
          </div>
        </div>
        <AnimatePresence
          onExitComplete={() => {
            restoreFullscreenFocusRef.current = true;
            setFullscreenOrigin(null);
          }}
        >
          {isFullscreen ? (
            <motion.div
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      transform: collapsedTransform,
                      borderRadius: "30px",
                    }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      transform: "translate(0px, 0px) scale(1, 1)",
                      borderRadius: "0px",
                    }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      transform: collapsedTransform,
                      borderRadius: "30px",
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.2, ease: "linear" }
                  : { duration: 0.22, ease: EASE_OUT }
              }
              className="fixed inset-0 z-[100] flex h-dvh min-h-0 items-center justify-center overflow-hidden border-0 bg-white p-3 dark:bg-neutral-950 sm:p-6"
              style={{ transformOrigin: "top left" }}
            >
              <button
                ref={exitFullscreenButtonRef}
                type="button"
                aria-label="Exit full screen preview"
                onClick={() => setIsExpanded(false)}
                className="absolute right-5 top-5 z-20 inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white/90 px-3 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:border-white/10 dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-900"
              >
                <Minimize2 className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Exit full screen</span>
              </button>
              <div className="relative flex h-full min-h-0 min-w-0 w-full items-center justify-center overflow-auto rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] p-4 dark:bg-black sm:p-6">
                {preview}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950 ${
        isCoinPricePreview
          ? "relative min-h-[450px] rounded-[30px] border border-[#f4f4f4] p-5 dark:border-[#141414] sm:p-6"
          : isLargePreview
            ? "relative min-h-175 rounded-[30px] border border-[#f4f4f4] p-3 dark:border-[#141414] sm:p-5"
            : "relative min-h-90 rounded-[30px] border border-[#f4f4f4] p-5 dark:border-[#141414] sm:p-6"
      }`}
    >
      <div
        className={`relative flex w-full ${isCoinPricePreview ? "items-start" : "items-center"} justify-center rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] dark:bg-black ${
          isLargePreview ||
          isCheckoutPreview ||
          isReviewPreview ||
          isRecipientPreview ||
          isTokenSafetyPreview ||
          isLifecyclePreview ||
          isReceiptPreview ||
          isProgressTimelinePreview ||
          isFeeEstimatePreview ||
          isHookPreview
              ? "min-w-0 overflow-hidden"
              : "overflow-visible"
        } ${
          isCoinPricePreview
            ? "min-h-[390px] p-4"
            : isLargePreview
              ? "min-h-160 p-4 sm:p-6"
              : "min-h-75 p-4"
        }`}
      >
        {preview}
      </div>
    </div>
  );
}
