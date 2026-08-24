"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type PaymentQuoteInput = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  swapMode?: "ExactIn" | "ExactOut";
};
export type PaymentQuote = {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  minimumOutputAmount: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  priceImpactPct: string;
  routeLabels: string[];
  contextSlot: number | null;
};
export type PaymentQuoteAdapter = ApiResourceAdapter<
  PaymentQuoteInput,
  PaymentQuote
>;

export function createPaymentQuoteAdapter(
  endpoint = "/api/payment-quote",
): PaymentQuoteAdapter {
  return async (input, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
    return readApiResource<PaymentQuote>(await fetch(url, { signal }));
  };
}

export function usePaymentQuote(
  input: PaymentQuoteInput | null,
  options: {
    adapter?: PaymentQuoteAdapter;
    endpoint?: string;
    enabled?: boolean;
  } = {},
) {
  const defaultAdapter = useMemo(
    () => createPaymentQuoteAdapter(options.endpoint),
    [options.endpoint],
  );
  const normalized = input
    ? {
        ...input,
        inputMint: input.inputMint.trim(),
        outputMint: input.outputMint.trim(),
        amount: input.amount.trim(),
        slippageBps: input.slippageBps ?? 50,
        swapMode: input.swapMode ?? ("ExactIn" as const),
      }
    : null;
  const requestKey = normalized ? JSON.stringify(normalized) : "";

  return useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled:
      (options.enabled ?? true) &&
      Boolean(normalized?.inputMint && normalized.outputMint && normalized.amount),
    input:
      normalized ?? {
        inputMint: "",
        outputMint: "",
        amount: "",
        slippageBps: 50,
        swapMode: "ExactIn",
      },
    requestKey,
  });
}
