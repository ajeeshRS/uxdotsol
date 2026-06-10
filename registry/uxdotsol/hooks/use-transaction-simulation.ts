"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Commitment,
  Connection,
  SimulatedTransactionResponse,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

type SerializableTransaction = Transaction | VersionedTransaction;
type SimulatableTransaction = SerializableTransaction | string | Uint8Array;

type KitSendable<T> = { send: () => Promise<T> };
type KitRpcLike = {
  simulateTransaction: (
    transaction: string,
    config?: Record<string, unknown>
  ) => KitSendable<unknown> | Promise<unknown>;
};

export type SimulationClient = Connection | KitRpcLike;

export type TransactionSimulationStatus =
  | "idle"
  | "simulating"
  | "success"
  | "failed";

export type TransactionSimulationOptions = {
  client?: SimulationClient | null;
  transaction?: SimulatableTransaction | null;
  commitment?: Commitment;
  replaceRecentBlockhash?: boolean;
  sigVerify?: boolean;
  accounts?: {
    encoding: "base64";
    addresses: string[];
  };
};

export type TransactionSimulationResult = {
  status: TransactionSimulationStatus;
  value: SimulatedTransactionResponse | unknown | null;
  error: Error | null;
  logs: string[];
  unitsConsumed: number | null;
  hasError: boolean;
};

const initialResult: TransactionSimulationResult = {
  status: "idle",
  value: null,
  error: null,
  logs: [],
  unitsConsumed: null,
  hasError: false,
};

function isWeb3Transaction(tx: SimulatableTransaction): tx is SerializableTransaction {
  return typeof tx === "object" && tx !== null && "serialize" in tx;
}

function isVersionedTransaction(tx: SerializableTransaction): tx is VersionedTransaction {
  return "version" in tx;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function toBase64Transaction(tx: SimulatableTransaction) {
  if (typeof tx === "string") return tx;
  if (tx instanceof Uint8Array) return bytesToBase64(tx);
  return bytesToBase64(tx.serialize());
}

function hasSend<T>(value: T | KitSendable<T>): value is KitSendable<T> {
  return Boolean(value && typeof value === "object" && "send" in value);
}

function readSimulationFields(value: unknown) {
  const record = value as {
    err?: unknown;
    logs?: string[] | null;
    unitsConsumed?: number;
    value?: {
      err?: unknown;
      logs?: string[] | null;
      unitsConsumed?: number;
    };
  };
  const response = record.value ?? record;

  return {
    logs: response.logs ?? [],
    unitsConsumed: response.unitsConsumed ?? null,
    hasError: Boolean(response.err),
  };
}

/**
 * Simulates a Solana transaction before rendering a preview or requesting a wallet signature.
 *
 * Accepts a web3.js `Connection` with a `Transaction` / `VersionedTransaction`, or a kit-style
 * RPC object with a base64 transaction string.
 */
export function useTransactionSimulation(options: TransactionSimulationOptions = {}) {
  const [result, setResult] = useState<TransactionSimulationResult>(initialResult);

  const canSimulate = useMemo(
    () => Boolean(options.client && options.transaction),
    [options.client, options.transaction]
  );

  const reset = useCallback(() => setResult(initialResult), []);

  const simulate = useCallback(
    async (override?: Partial<TransactionSimulationOptions>) => {
      const client = override?.client ?? options.client;
      const transaction = override?.transaction ?? options.transaction;

      if (!client) {
        const error = new Error("Missing Solana client.");
        setResult({ ...initialResult, status: "failed", error, hasError: true });
        return null;
      }

      if (!transaction) {
        const error = new Error("Missing transaction to simulate.");
        setResult({ ...initialResult, status: "failed", error, hasError: true });
        return null;
      }

      setResult((current) => ({ ...current, status: "simulating", error: null }));

      try {
        const commitment = override?.commitment ?? options.commitment ?? "processed";
        const replaceRecentBlockhash =
          override?.replaceRecentBlockhash ?? options.replaceRecentBlockhash ?? true;
        const sigVerify = override?.sigVerify ?? options.sigVerify ?? false;
        const accounts = override?.accounts ?? options.accounts;

        let value: unknown;

        if (isWeb3Transaction(transaction) && "simulateTransaction" in client) {
          value = isVersionedTransaction(transaction)
            ? await (client as Connection).simulateTransaction(transaction, {
                commitment,
                replaceRecentBlockhash,
                sigVerify,
                accounts,
              })
            : await (client as Connection).simulateTransaction(transaction);
        } else if ("simulateTransaction" in client) {
          const request = (client as KitRpcLike).simulateTransaction(
            toBase64Transaction(transaction),
            {
              commitment,
              replaceRecentBlockhash,
              sigVerify,
              accounts,
              encoding: "base64",
            }
          );
          value = hasSend(request) ? await request.send() : await request;
        } else {
          throw new Error("Client does not expose simulateTransaction.");
        }

        const fields = readSimulationFields(value);
        const nextResult = {
          status: fields.hasError ? "failed" : "success",
          value,
          error: null,
          logs: fields.logs,
          unitsConsumed: fields.unitsConsumed,
          hasError: fields.hasError,
        } satisfies TransactionSimulationResult;

        setResult(nextResult);
        return nextResult;
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        const nextResult = {
          ...initialResult,
          status: "failed",
          error,
          hasError: true,
        } satisfies TransactionSimulationResult;
        setResult(nextResult);
        return nextResult;
      }
    },
    [options]
  );

  return {
    ...result,
    canSimulate,
    isSimulating: result.status === "simulating",
    simulate,
    reset,
  };
}
