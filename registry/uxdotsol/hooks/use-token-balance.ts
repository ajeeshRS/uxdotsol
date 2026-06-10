"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PublicKey,
  type Commitment,
  type Connection,
} from "@solana/web3.js";

export type TokenBalanceOptions = {
  connection?: Connection | null;
  commitment?: Commitment;
  refreshIntervalMs?: number;
};

export type TokenBalanceValue = {
  balance: number | null;
  formattedBalance: string | null;
  rawBalance: bigint | null;
  decimals: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

function formatTokenAmount(amount: bigint, decimals: number) {
  if (decimals === 0) return amount.toString();

  const padded = amount.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function toPublicKey(value: string | PublicKey, label: string) {
  try {
    return value instanceof PublicKey ? value : new PublicKey(value);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }
}

/**
 * Loads and aggregates every SPL token account owned by a wallet for one mint.
 * The raw bigint and formatted string remain precise for large token balances.
 */
export function useTokenBalance(
  publicKey: string | PublicKey | null | undefined,
  mint: string | PublicKey | null | undefined,
  options: TokenBalanceOptions = {},
): TokenBalanceValue {
  const [balance, setBalance] = useState<number | null>(null);
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);
  const [rawBalance, setRawBalance] = useState<bigint | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);
  const generationRef = useRef(0);
  const connection = options.connection;
  const inputKey =
    publicKey && mint && connection
      ? `${publicKey.toString()}:${mint.toString()}:${options.commitment ?? "confirmed"}`
      : null;

  const refetch = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    let interval: number | null = null;
    let loadId = 0;

    if (!publicKey || !mint || !connection || !inputKey) return;

    const load = async () => {
      const currentLoadId = ++loadId;
      setIsLoading(true);
      setError(null);

      try {
        const owner = toPublicKey(publicKey, "wallet address");
        const tokenMint = toPublicKey(mint, "token mint");
        const response = await connection.getParsedTokenAccountsByOwner(
          owner,
          { mint: tokenMint },
          options.commitment ?? "confirmed",
        );

        if (
          generation !== generationRef.current ||
          currentLoadId !== loadId
        ) {
          return;
        }

        let nextRawBalance = 0n;
        let nextDecimals: number | null = null;

        for (const account of response.value) {
          const tokenAmount = (
            account.account.data as {
              parsed?: {
                info?: {
                  tokenAmount?: { amount?: string; decimals?: number };
                };
              };
            }
          ).parsed?.info?.tokenAmount;

          if (
            typeof tokenAmount?.amount !== "string" ||
            typeof tokenAmount.decimals !== "number"
          ) {
            throw new Error("RPC returned an invalid token balance.");
          }

          if (
            nextDecimals !== null &&
            nextDecimals !== tokenAmount.decimals
          ) {
            throw new Error("Token accounts returned inconsistent decimals.");
          }

          nextDecimals = tokenAmount.decimals;
          nextRawBalance += BigInt(tokenAmount.amount);
        }

        if (nextDecimals === null) {
          const supply = await connection.getTokenSupply(
            tokenMint,
            options.commitment ?? "confirmed",
          );
          if (
            generation !== generationRef.current ||
            currentLoadId !== loadId
          ) {
            return;
          }
          nextDecimals = supply.value.decimals;
        }

        const nextFormattedBalance = formatTokenAmount(
          nextRawBalance,
          nextDecimals,
        );
        const numericBalance = Number(nextFormattedBalance);

        setRawBalance(nextRawBalance);
        setDecimals(nextDecimals);
        setFormattedBalance(nextFormattedBalance);
        setBalance(
          nextRawBalance <= BigInt(Number.MAX_SAFE_INTEGER) &&
            Number.isFinite(numericBalance)
            ? numericBalance
            : null,
        );
        setResolvedKey(inputKey);
      } catch (cause) {
        if (
          generation !== generationRef.current ||
          currentLoadId !== loadId
        ) {
          return;
        }
        setBalance(null);
        setFormattedBalance(null);
        setRawBalance(null);
        setDecimals(null);
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setResolvedKey(inputKey);
      } finally {
        if (
          generation === generationRef.current &&
          currentLoadId === loadId
        ) {
          setIsLoading(false);
        }
      }
    };

    void load();

    if (options.refreshIntervalMs && options.refreshIntervalMs > 0) {
      interval = window.setInterval(load, options.refreshIntervalMs);
    }

    return () => {
      generationRef.current += 1;
      if (interval) window.clearInterval(interval);
    };
  }, [
    connection,
    inputKey,
    mint,
    options.commitment,
    options.refreshIntervalMs,
    publicKey,
    requestId,
  ]);

  if (!publicKey || !mint) {
    return {
      balance: null,
      formattedBalance: null,
      rawBalance: null,
      decimals: null,
      isLoading: false,
      error: null,
      refetch,
    };
  }

  if (!connection || !inputKey) {
    return {
      balance: null,
      formattedBalance: null,
      rawBalance: null,
      decimals: null,
      isLoading: false,
      error: new Error("Missing Solana connection."),
      refetch,
    };
  }

  const isCurrent = resolvedKey === inputKey;

  return {
    balance: isCurrent ? balance : null,
    formattedBalance: isCurrent ? formattedBalance : null,
    rawBalance: isCurrent ? rawBalance : null,
    decimals: isCurrent ? decimals : null,
    isLoading: !isCurrent || isLoading,
    error: isCurrent ? error : null,
    refetch,
  };
}
