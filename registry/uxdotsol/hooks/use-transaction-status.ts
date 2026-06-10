"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Commitment, Connection, SignatureResult } from "@solana/web3.js";

type KitSendable<T> = { send: () => Promise<T> };
type KitRpcLike = {
  getSignatureStatuses?: (signatures: string[]) => KitSendable<unknown> | Promise<unknown>;
};

export type TransactionStatusClient = Connection | KitRpcLike;

export type TransactionStatusState =
  | "idle"
  | "pending"
  | "processed"
  | "confirmed"
  | "finalized"
  | "failed"
  | "expired";

export type TransactionStatusOptions = {
  signature?: string | null;
  client?: TransactionStatusClient | null;
  commitment?: Commitment;
  pollIntervalMs?: number;
  timeoutMs?: number;
  subscribe?: boolean;
  cluster?: "mainnet-beta" | "devnet" | "testnet" | "custom";
  explorer?: "solscan" | "explorer" | "xray";
  explorerUrl?: string;
};

export type TransactionStatusValue = {
  status: TransactionStatusState;
  signature: string | null;
  confirmations: number | null;
  confirmationStatus: string | null;
  error: SignatureResult["err"] | Error | null;
  explorerLink: string | null;
  isPending: boolean;
  isTerminal: boolean;
};

function hasSend<T>(value: T | KitSendable<T>): value is KitSendable<T> {
  return Boolean(value && typeof value === "object" && "send" in value);
}

function buildExplorerLink(options: TransactionStatusOptions) {
  if (!options.signature) return null;
  if (options.explorerUrl) return `${options.explorerUrl.replace(/\/$/, "")}/${options.signature}`;

  const cluster = options.cluster ?? "mainnet-beta";
  const clusterParam = cluster === "mainnet-beta" || cluster === "custom" ? "" : `?cluster=${cluster}`;

  if (options.explorer === "xray") return `https://xray.helius.xyz/tx/${options.signature}${clusterParam}`;
  if (options.explorer === "explorer") return `https://explorer.solana.com/tx/${options.signature}${clusterParam}`;
  return `https://solscan.io/tx/${options.signature}${cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`}`;
}

function readStatus(response: unknown) {
  let value = response;

  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(value)) return value[0] ?? null;
    if (!value || typeof value !== "object") return null;

    const record = value as { value?: unknown; result?: unknown };
    if ("value" in record) {
      value = record.value;
      continue;
    }
    if ("result" in record) {
      value = record.result;
      continue;
    }
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : null;
}

async function getStatus(client: TransactionStatusClient, signature: string) {
  if ("getSignatureStatuses" in client && client.getSignatureStatuses) {
    const request = client.getSignatureStatuses([signature]);
    const response = hasSend(request) ? await request.send() : await request;
    return readStatus(response);
  }

  throw new Error("Client does not expose getSignatureStatuses.");
}

function normalizeStatus(status: unknown): Omit<TransactionStatusValue, "signature" | "explorerLink" | "isPending" | "isTerminal"> {
  if (!status) {
    return {
      status: "pending",
      confirmations: null,
      confirmationStatus: null,
      error: null,
    };
  }

  const record = status as {
    err?: SignatureResult["err"];
    confirmations?: number | null;
    confirmationStatus?: "processed" | "confirmed" | "finalized";
  };

  if (record.err) {
    return {
      status: "failed",
      confirmations: record.confirmations ?? null,
      confirmationStatus: record.confirmationStatus ?? null,
      error: record.err,
    };
  }

  const state =
    record.confirmationStatus === "finalized"
      ? "finalized"
      : record.confirmationStatus === "confirmed"
        ? "confirmed"
        : record.confirmationStatus === "processed"
          ? "processed"
          : "pending";

  return {
    status: state,
    confirmations: record.confirmations ?? null,
    confirmationStatus: record.confirmationStatus ?? null,
    error: null,
  };
}

function commitmentRank(commitment: Commitment) {
  if (
    commitment === "finalized" ||
    commitment === "max" ||
    commitment === "root"
  ) {
    return 2;
  }
  if (
    commitment === "confirmed" ||
    commitment === "single" ||
    commitment === "singleGossip"
  ) {
    return 1;
  }
  return 0;
}

function statusRank(status: TransactionStatusState) {
  if (status === "finalized") return 2;
  if (status === "confirmed") return 1;
  if (status === "processed") return 0;
  return -1;
}

function commitmentStatus(commitment: Commitment) {
  const rank = commitmentRank(commitment);
  return rank === 2 ? "finalized" : rank === 1 ? "confirmed" : "processed";
}

/**
 * Tracks a Solana transaction signature with subscription-first status updates,
 * polling fallback, terminal states, timeout handling, and an explorer link.
 */
export function useTransactionStatus(options: TransactionStatusOptions) {
  const {
    client,
    cluster,
    commitment,
    explorer,
    explorerUrl,
    pollIntervalMs = 2_000,
    signature,
    subscribe = true,
    timeoutMs = 90_000,
  } = options;
  const targetCommitment = commitment ?? "confirmed";

  const [value, setValue] = useState<TransactionStatusValue>(() => ({
    status: signature ? "pending" : "idle",
    signature: signature ?? null,
    confirmations: null,
    confirmationStatus: null,
    error: null,
    explorerLink: buildExplorerLink({ signature, cluster, explorer, explorerUrl }),
    isPending: Boolean(signature),
    isTerminal: false,
  }));
  const [requestId, setRequestId] = useState(0);
  const startedAtRef = useRef(Date.now());

  const explorerLink = useMemo(
    () => buildExplorerLink({ signature, cluster, explorer, explorerUrl }),
    [signature, cluster, explorer, explorerUrl]
  );

  const retry = useCallback(() => {
    startedAtRef.current = Date.now();
    setValue({
      status: signature ? "pending" : "idle",
      signature: signature ?? null,
      confirmations: null,
      confirmationStatus: null,
      error: null,
      explorerLink,
      isPending: Boolean(signature),
      isTerminal: false,
    });
    setRequestId((current) => current + 1);
  }, [signature, explorerLink]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;
    let subscriptionId: number | null = null;

    startedAtRef.current = Date.now();

    if (!signature) {
      setValue({
        status: "idle",
        signature: null,
        confirmations: null,
        confirmationStatus: null,
        error: null,
        explorerLink: null,
        isPending: false,
        isTerminal: false,
      });
      return;
    }

    if (!client) {
      setValue({
        status: "failed",
        signature,
        confirmations: null,
        confirmationStatus: null,
        error: new Error("Missing Solana client."),
        explorerLink,
        isPending: false,
        isTerminal: true,
      });
      return;
    }

    const applyStatus = (rawStatus: unknown) => {
      const next = normalizeStatus(rawStatus);
      const terminal =
        next.status === "failed" ||
        statusRank(next.status) >= commitmentRank(targetCommitment);
      setValue({
        ...next,
        signature,
        explorerLink,
        isPending: !terminal,
        isTerminal: terminal,
      });
      return terminal;
    };

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - startedAtRef.current > timeoutMs) {
        setValue((current) => ({
          ...current,
          status: "expired",
          error: new Error("Timed out waiting for transaction confirmation."),
          isPending: false,
          isTerminal: true,
        }));
        if (interval) window.clearInterval(interval);
        return;
      }

      try {
        const status = await getStatus(client, signature);
        if (cancelled) return;
        const terminal = applyStatus(status);
        if (terminal && interval) window.clearInterval(interval);
      } catch (cause) {
        if (cancelled) return;
        setValue((current) => ({
          ...current,
          error: cause instanceof Error ? cause : new Error(String(cause)),
        }));
      }
    };

    setValue({
      status: "pending",
      signature,
      confirmations: null,
      confirmationStatus: null,
      error: null,
      explorerLink,
      isPending: true,
      isTerminal: false,
    });

    if (subscribe && "onSignature" in client && "removeSignatureListener" in client) {
      subscriptionId = (client as Connection).onSignature(
        signature,
        (notification) => {
          if (cancelled) return;
          const terminal = applyStatus({
            err: notification.err,
            confirmations: null,
            confirmationStatus: commitmentStatus(targetCommitment),
          });
          if (terminal && interval) window.clearInterval(interval);
        },
        targetCommitment
      );
    }

    void poll();
    interval = window.setInterval(poll, pollIntervalMs);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      if (subscriptionId !== null && "removeSignatureListener" in client) {
        void (client as Connection).removeSignatureListener(subscriptionId);
      }
    };
  }, [
    client,
    signature,
    targetCommitment,
    pollIntervalMs,
    timeoutMs,
    subscribe,
    explorerLink,
    requestId,
  ]);

  return { ...value, retry };
}
