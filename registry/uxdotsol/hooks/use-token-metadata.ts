"use client";

import { useMemo } from "react";
import {
  readApiResource,
  useApiResource,
  type ApiResourceAdapter,
} from "./use-api-resource";

export type TokenMetadata = {
  mint: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  isVerified: boolean | null;
  tags: string[];
  liquidity: number | null;
  holderCount: number | null;
};

export type TokenMetadataAdapter = ApiResourceAdapter<
  { mint: string },
  TokenMetadata
>;

export function createTokenMetadataAdapter(
  endpoint = "/api/token-metadata",
): TokenMetadataAdapter {
  return async ({ mint }, { signal }) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("mint", mint);
    return readApiResource<TokenMetadata>(await fetch(url, { signal }));
  };
}

export function useTokenMetadata(
  mint: string | null | undefined,
  options: {
    adapter?: TokenMetadataAdapter;
    endpoint?: string;
    enabled?: boolean;
  } = {},
) {
  const normalizedMint = mint?.trim() ?? "";
  const defaultAdapter = useMemo(
    () => createTokenMetadataAdapter(options.endpoint),
    [options.endpoint],
  );

  return useApiResource({
    adapter: options.adapter ?? defaultAdapter,
    enabled: (options.enabled ?? true) && normalizedMint.length > 0,
    input: { mint: normalizedMint },
    requestKey: normalizedMint,
  });
}
