"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type TokenListItem = {
  mint: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  isVerified: boolean | null;
  liquidity: number | null;
};

export type TokenListData = {
  query: string;
  tokens: TokenListItem[];
};

export type TokenListInput = { query: string; limit: number };
export type TokenListAdapter = ApiResourceAdapter<TokenListInput, TokenListData>;

export function createTokenListAdapter(endpoint = "/api/token-list"): TokenListAdapter {
  return async ({ query, limit }, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(limit));
    return readApiResource<TokenListData>(await fetch(url, { signal }));
  };
}

export function useTokenList(
  query: string,
  options: {
    adapter?: TokenListAdapter;
    endpoint?: string;
    enabled?: boolean;
    limit?: number;
  } = {},
) {
  const normalizedQuery = query.trim();
  const limit = Math.min(50, Math.max(1, options.limit ?? 12));
  const defaultAdapter = useMemo(
    () => createTokenListAdapter(options.endpoint),
    [options.endpoint],
  );
  const resource = useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled: (options.enabled ?? true) && normalizedQuery.length >= 2,
    input: { query: normalizedQuery, limit },
    requestKey: `${normalizedQuery}:${limit}`,
  });

  return { ...resource, tokens: resource.data?.tokens ?? [] };
}
