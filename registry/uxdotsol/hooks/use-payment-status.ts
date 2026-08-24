"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type PaymentStatusCluster = "mainnet-beta" | "devnet" | "testnet";
export type PaymentStatusData = {
  signature: string;
  cluster: PaymentStatusCluster;
  status: "not_found" | "processed" | "confirmed" | "finalized" | "failed";
  slot: number | null;
  confirmations: number | null;
  error: unknown | null;
};
export type PaymentStatusAdapter = ApiResourceAdapter<
  { signature: string; cluster: PaymentStatusCluster },
  PaymentStatusData
>;

export function createPaymentStatusAdapter(
  endpoint = "/api/payment-status",
): PaymentStatusAdapter {
  return async ({ signature, cluster }, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("signature", signature);
    url.searchParams.set("cluster", cluster);
    return readApiResource<PaymentStatusData>(await fetch(url, { signal }));
  };
}

export function usePaymentStatus(
  signature: string | null | undefined,
  options: {
    adapter?: PaymentStatusAdapter;
    endpoint?: string;
    enabled?: boolean;
    cluster?: PaymentStatusCluster;
  } = {},
) {
  const normalizedSignature = signature?.trim() ?? "";
  const cluster = options.cluster ?? "mainnet-beta";
  const defaultAdapter = useMemo(
    () => createPaymentStatusAdapter(options.endpoint),
    [options.endpoint],
  );

  return useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled: (options.enabled ?? true) && normalizedSignature.length > 0,
    input: { signature: normalizedSignature, cluster },
    requestKey: `${cluster}:${normalizedSignature}`,
  });
}
