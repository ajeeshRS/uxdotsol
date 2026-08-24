"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type PriorityFeeCluster = "mainnet-beta" | "devnet" | "testnet";
export type PriorityFeeEstimate = {
  cluster: PriorityFeeCluster;
  unit: "microLamportsPerComputeUnit";
  low: number;
  medium: number;
  high: number;
  sampleSize: number;
  slot: number | null;
};
export type PriorityFeeInput = {
  cluster: PriorityFeeCluster;
  writableAccounts: string[];
};
export type PriorityFeeAdapter = ApiResourceAdapter<
  PriorityFeeInput,
  PriorityFeeEstimate
>;

export function createPriorityFeeAdapter(
  endpoint = "/api/priority-fee-estimate",
): PriorityFeeAdapter {
  return async ({ cluster, writableAccounts }, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("cluster", cluster);
    writableAccounts.forEach((account) => url.searchParams.append("account", account));
    return readApiResource<PriorityFeeEstimate>(await fetch(url, { signal }));
  };
}

export function usePriorityFeeEstimate(
  writableAccounts: readonly string[] = [],
  options: {
    adapter?: PriorityFeeAdapter;
    endpoint?: string;
    enabled?: boolean;
    cluster?: PriorityFeeCluster;
  } = {},
) {
  const cluster = options.cluster ?? "mainnet-beta";
  const accounts = writableAccounts.map((value) => value.trim()).filter(Boolean);
  const accountKey = accounts.join(",");
  const defaultAdapter = useMemo(
    () => createPriorityFeeAdapter(options.endpoint),
    [options.endpoint],
  );

  return useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled: options.enabled ?? true,
    input: { cluster, writableAccounts: accounts },
    requestKey: `${cluster}:${accountKey}`,
  });
}
