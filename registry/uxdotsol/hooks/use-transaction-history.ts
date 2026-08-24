"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type TransactionHistoryCluster = "mainnet-beta" | "devnet" | "testnet";
export type TransactionHistoryItem = {
  signature: string;
  slot: number;
  blockTime: string | null;
  memo: string | null;
  status: "processed" | "confirmed" | "finalized" | "failed";
  error: unknown | null;
};
export type TransactionHistoryData = {
  address: string;
  cluster: TransactionHistoryCluster;
  items: TransactionHistoryItem[];
  nextCursor: string | null;
};
export type TransactionHistoryInput = {
  address: string;
  cluster: TransactionHistoryCluster;
  limit: number;
  before?: string;
};
export type TransactionHistoryAdapter = ApiResourceAdapter<
  TransactionHistoryInput,
  TransactionHistoryData
>;

export function createTransactionHistoryAdapter(
  endpoint = "/api/transaction-history",
): TransactionHistoryAdapter {
  return async ({ address, cluster, limit, before }, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("address", address);
    url.searchParams.set("cluster", cluster);
    url.searchParams.set("limit", String(limit));
    if (before) url.searchParams.set("before", before);
    return readApiResource<TransactionHistoryData>(await fetch(url, { signal }));
  };
}

export function useTransactionHistory(
  address: string | null | undefined,
  options: {
    adapter?: TransactionHistoryAdapter;
    endpoint?: string;
    enabled?: boolean;
    cluster?: TransactionHistoryCluster;
    limit?: number;
    before?: string;
  } = {},
) {
  const normalizedAddress = address?.trim() ?? "";
  const cluster = options.cluster ?? "mainnet-beta";
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const defaultAdapter = useMemo(
    () => createTransactionHistoryAdapter(options.endpoint),
    [options.endpoint],
  );

  return useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled: (options.enabled ?? true) && normalizedAddress.length > 0,
    input: {
      address: normalizedAddress,
      cluster,
      limit,
      before: options.before,
    },
    requestKey: `${cluster}:${normalizedAddress}:${limit}:${options.before ?? ""}`,
  });
}
