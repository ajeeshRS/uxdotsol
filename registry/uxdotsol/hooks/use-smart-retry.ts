"use client";

import { useCallback, useRef, useState } from "react";
import type { Connection } from "@solana/web3.js";

type KitSendable<T> = { send: () => Promise<T> };
type KitRpcLike = {
  getLatestBlockhash?: () => KitSendable<unknown> | Promise<unknown>;
};

export type SmartRetryClient = Connection | KitRpcLike;

export type SolanaRetryReason =
  | "blockhash-expired"
  | "rate-limited"
  | "node-unhealthy"
  | "simulation-failed"
  | "transport"
  | "unknown";

export type SmartRetryDecision = {
  reason: SolanaRetryReason;
  retryable: boolean;
  refreshBlockhash: boolean;
};

export type SmartRetryOptions<T> = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  client?: SmartRetryClient | null;
  refreshBlockhash?: () => Promise<unknown>;
  shouldRetry?: (error: unknown, attempt: number, decision: SmartRetryDecision) => boolean;
  onAttempt?: (attempt: number) => void;
  onRetry?: (error: unknown, attempt: number, delayMs: number, decision: SmartRetryDecision) => void;
  onSuccess?: (value: T, attempt: number) => void;
  onFailure?: (error: unknown, attempt: number) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getErrorText(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase();
  return String(error).toLowerCase();
}

function hasSend<T>(value: T | KitSendable<T>): value is KitSendable<T> {
  return Boolean(value && typeof value === "object" && "send" in value);
}

/**
 * Classifies common Solana failures into retry behavior.
 */
export function classifySolanaRetry(error: unknown): SmartRetryDecision {
  const text = getErrorText(error);

  if (
    text.includes("blockhash not found") ||
    text.includes("transaction expired") ||
    text.includes("block height exceeded") ||
    text.includes("lastvalidblockheight")
  ) {
    return { reason: "blockhash-expired", retryable: true, refreshBlockhash: true };
  }

  if (text.includes("429") || text.includes("too many requests") || text.includes("rate limit")) {
    return { reason: "rate-limited", retryable: true, refreshBlockhash: false };
  }

  if (text.includes("node is behind") || text.includes("unhealthy") || text.includes("503")) {
    return { reason: "node-unhealthy", retryable: true, refreshBlockhash: true };
  }

  if (text.includes("failed to fetch") || text.includes("network") || text.includes("timeout")) {
    return { reason: "transport", retryable: true, refreshBlockhash: false };
  }

  if (text.includes("simulation failed") || text.includes("transaction simulation failed")) {
    return { reason: "simulation-failed", retryable: false, refreshBlockhash: false };
  }

  return { reason: "unknown", retryable: false, refreshBlockhash: false };
}

function getDelayMs(attempt: number, options: Required<Pick<SmartRetryOptions<unknown>, "baseDelayMs" | "maxDelayMs" | "jitter">>) {
  const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  if (!options.jitter) return exponential;
  return Math.round(exponential * (0.75 + Math.random() * 0.5));
}

async function refreshFromClient(client?: SmartRetryClient | null) {
  if (!client || !("getLatestBlockhash" in client) || !client.getLatestBlockhash) return null;
  const request = client.getLatestBlockhash();
  return hasSend(request) ? request.send() : request;
}

/**
 * Runs a Solana operation with exponential backoff, common error classification,
 * and automatic blockhash refresh when the failure indicates stale transaction data.
 */
export function useSmartRetry<T = unknown>(options: SmartRetryOptions<T> = {}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef(false);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setIsRetrying(false);
  }, []);

  const execute = useCallback(
    async (operation: (attempt: number) => Promise<T>, override?: Partial<SmartRetryOptions<T>>) => {
      abortRef.current = false;
      setIsRetrying(true);
      setError(null);

      const maxAttempts = override?.maxAttempts ?? options.maxAttempts ?? 4;
      const delayOptions = {
        baseDelayMs: override?.baseDelayMs ?? options.baseDelayMs ?? 400,
        maxDelayMs: override?.maxDelayMs ?? options.maxDelayMs ?? 6_000,
        jitter: override?.jitter ?? options.jitter ?? true,
      };

      for (let currentAttempt = 1; currentAttempt <= maxAttempts; currentAttempt += 1) {
        if (abortRef.current) throw new Error("Retry cancelled.");
        setAttempt(currentAttempt);
        options.onAttempt?.(currentAttempt);
        override?.onAttempt?.(currentAttempt);

        try {
          const value = await operation(currentAttempt);
          setIsRetrying(false);
          options.onSuccess?.(value, currentAttempt);
          override?.onSuccess?.(value, currentAttempt);
          return value;
        } catch (caught) {
          const decision = classifySolanaRetry(caught);
          const canRetry =
            currentAttempt < maxAttempts &&
            !abortRef.current &&
            (override?.shouldRetry ?? options.shouldRetry ?? ((_, __, retry) => retry.retryable))(
              caught,
              currentAttempt,
              decision
            );

          setError(caught);

          if (decision.refreshBlockhash) {
            await (override?.refreshBlockhash ?? options.refreshBlockhash ?? (() => refreshFromClient(override?.client ?? options.client)))();
          }

          if (!canRetry) {
            setIsRetrying(false);
            options.onFailure?.(caught, currentAttempt);
            override?.onFailure?.(caught, currentAttempt);
            throw caught;
          }

          const delayMs = getDelayMs(currentAttempt, delayOptions);
          options.onRetry?.(caught, currentAttempt, delayMs, decision);
          override?.onRetry?.(caught, currentAttempt, delayMs, decision);
          await sleep(delayMs);
        }
      }

      throw error ?? new Error("Retry failed.");
    },
    [error, options]
  );

  return {
    execute,
    cancel,
    isRetrying,
    attempt,
    error,
    classifySolanaRetry,
  };
}
