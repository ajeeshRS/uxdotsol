"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";

export type PrivatePaymentCluster =
  | "mainnet"
  | "devnet"
  | `http://${string}`
  | `https://${string}`;
export type PrivatePaymentBalanceLocation = "base" | "ephemeral";
export type PrivatePaymentVisibility = "public" | "private";

export type PrivatePaymentConfig = {
  endpoint?: string;
  cluster?: PrivatePaymentCluster;
  validator?: string;
  authToken?: string;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
};

export type PrivatePaymentStatus = "idle" | "loading" | "success" | "error";

export type PrivatePaymentError = Error & {
  status?: number;
  payload?: unknown;
  path?: string;
};

export type PrivatePaymentRequestMeta = {
  method: string;
  path: string;
  startedAt: number;
  completedAt?: number;
};

export type PrivatePaymentState = {
  status: PrivatePaymentStatus;
  isLoading: boolean;
  error: PrivatePaymentError | null;
  lastResponse: unknown | null;
  lastRequest: PrivatePaymentRequestMeta | null;
};

export type PrivatePaymentTxResponse = {
  kind: "deposit" | "withdraw" | "transfer" | "initializeMint" | (string & {});
  version: "legacy" | "v0";
  transactionBase64: string;
  sendTo: PrivatePaymentBalanceLocation;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  instructionCount: number;
  requiredSigners: string[];
  validator: string;
  transferQueue?: string;
  rentPda?: string;
};

export type PrivatePaymentBalance = {
  address: string;
  mint: string;
  ata: string;
  location: PrivatePaymentBalanceLocation;
  balance: string;
};

type RequestDefaults = {
  cluster?: PrivatePaymentCluster;
  validator?: string;
};

type AuthParams = {
  authToken?: string;
};

export type PrivatePaymentDepositParams = RequestDefaults & {
  owner: string;
  mint?: string;
  /** Integer amount in token base units. */
  amount: number;
  initIfMissing?: boolean;
  initVaultIfMissing?: boolean;
  initAtasIfMissing?: boolean;
  idempotent?: boolean;
};

export type PrivatePaymentTransferParams = RequestDefaults &
  AuthParams & {
    from: string;
    to: string;
    mint: string;
    /** Integer amount in token base units. */
    amount: number;
    visibility: PrivatePaymentVisibility;
    fromBalance: PrivatePaymentBalanceLocation;
    toBalance: PrivatePaymentBalanceLocation;
    initIfMissing?: boolean;
    initAtasIfMissing?: boolean;
    initVaultIfMissing?: boolean;
    memo?: string;
    minDelayMs?: string;
    maxDelayMs?: string;
    clientRefId?: string;
    split?: number;
    gasless?: boolean;
    exactOut?: boolean;
    legacy?: boolean;
  };

export type PrivatePaymentWithdrawParams = RequestDefaults & {
  owner: string;
  mint: string;
  /** Integer amount in token base units. */
  amount: number;
  initIfMissing?: boolean;
  initAtasIfMissing?: boolean;
  escrowIndex?: number;
  idempotent?: boolean;
};

export type PrivatePaymentInitializeMintParams = RequestDefaults & {
  payer: string;
  mint: string;
};

export type PrivatePaymentBalanceParams = {
  address: string;
  mint: string;
  cluster?: PrivatePaymentCluster;
};

export type PrivatePaymentPrivateBalanceParams = PrivatePaymentBalanceParams & AuthParams;

export type PrivatePaymentIsMintInitializedParams = RequestDefaults & {
  mint: string;
};

export type PrivatePaymentMintInitialization = {
  mint: string;
  validator: string;
  transferQueue: string;
  initialized: boolean;
};

export type PrivatePaymentChallengeParams = {
  pubkey: string;
  cluster?: PrivatePaymentCluster;
  mock?: boolean;
};

export type PrivatePaymentLoginParams = PrivatePaymentChallengeParams & {
  challenge: string;
  signature: string;
};

const DEFAULT_ENDPOINT = "https://payments.magicblock.app";

function cleanBody<T extends Record<string, unknown>>(body: T) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function toQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function extractPayloadMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (Array.isArray(payload)) {
    const messages = payload.map(extractPayloadMessage).filter((message): message is string => Boolean(message));
    return messages.length > 0 ? messages.join("; ") : null;
  }

  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  return extractPayloadMessage(record.message ?? record.msg ?? record.error ?? record.detail);
}

function getPayloadMessage(payload: unknown, status: number) {
  return extractPayloadMessage(payload) ?? `Private Payments request failed with status ${status}.`;
}

function createPaymentError(
  message: string,
  details: Pick<PrivatePaymentError, "status" | "payload" | "path">,
) {
  const error = new Error(message) as PrivatePaymentError;
  error.status = details.status;
  error.payload = details.payload;
  error.path = details.path;
  return error;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>) {
  const merged = new Headers();

  sources.forEach((source) => {
    if (!source) return;
    new Headers(source).forEach((value, key) => merged.set(key, value));
  });

  return merged;
}

function authorizationHeaders(authToken?: string) {
  if (!authToken?.trim()) return undefined;
  const value = /^Bearer\s/i.test(authToken) ? authToken : `Bearer ${authToken}`;
  return { Authorization: value };
}

async function parsePayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function readJson<T>(response: Response, path: string): Promise<T> {
  const payload = await parsePayload(response);

  if (!response.ok) {
    throw createPaymentError(getPayloadMessage(payload, response.status), {
      status: response.status,
      payload,
      path,
    });
  }

  return payload as T;
}

/**
 * Minimal client hook for MagicBlock Private Payments API.
 *
 * Builds unsigned SPL transactions for deposit, transfer, withdraw, and mint initialization,
 * and reads public/private balances. API shapes follow payments.magicblock.app.
 */
export function usePrivatePayment(config: PrivatePaymentConfig = {}) {
  const {
    endpoint = DEFAULT_ENDPOINT,
    cluster,
    validator,
    authToken,
    headers,
    fetcher = fetch,
  } = config;
  const [state, setState] = useState<PrivatePaymentState>({
    status: "idle",
    isLoading: false,
    error: null,
    lastResponse: null,
    lastRequest: null,
  });
  const activeRequestsRef = useRef(0);
  const requestGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((next: SetStateAction<PrivatePaymentState>) => {
    if (mountedRef.current) setState(next);
  }, []);

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const startedAt = Date.now();
      const requestMeta: PrivatePaymentRequestMeta = { method, path, startedAt };
      const requestGeneration = requestGenerationRef.current;
      const updateState = (next: SetStateAction<PrivatePaymentState>) => {
        if (requestGeneration === requestGenerationRef.current) safeSetState(next);
      };

      activeRequestsRef.current += 1;
      updateState((current) => ({
        ...current,
        status: "loading",
        isLoading: true,
        error: null,
        lastRequest: requestMeta,
      }));

      try {
        const baseUrl = endpoint.replace(/\/+$/, "");
        const response = await fetcher(`${baseUrl}${path}`, {
          ...init,
          headers: mergeHeaders(
            { Accept: "application/json" },
            authorizationHeaders(authToken),
            headers,
            init.headers
          ),
        });

        const data = await readJson<T>(response, path);
        updateState((current) => ({
          ...current,
          status: "success",
          error: null,
          lastResponse: data,
          lastRequest: { ...requestMeta, completedAt: Date.now() },
        }));
        return data;
      } catch (cause) {
        const nextError =
          cause instanceof Error
            ? (cause as PrivatePaymentError)
            : createPaymentError(String(cause), { path });
        nextError.path ??= path;

        updateState((current) => ({
          ...current,
          status: "error",
          error: nextError,
          lastRequest: { ...requestMeta, completedAt: Date.now() },
        }));
        throw nextError;
      } finally {
        if (requestGeneration === requestGenerationRef.current) {
          activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
          updateState((current) => ({
            ...current,
            status: activeRequestsRef.current > 0 ? "loading" : current.status,
            isLoading: activeRequestsRef.current > 0,
          }));
        }
      }
    },
    [authToken, endpoint, fetcher, headers, safeSetState]
  );

  const withDefaults = useCallback(
    <T extends RequestDefaults>(params: T) =>
      cleanBody({
        ...params,
        cluster: params.cluster ?? cluster,
        validator: params.validator ?? validator,
      }),
    [cluster, validator]
  );

  const withCluster = useCallback(
    <T extends { cluster?: PrivatePaymentCluster }>(params: T) =>
      cleanBody({
        ...params,
        cluster: params.cluster ?? cluster,
      }),
    [cluster]
  );

  const postJson = useCallback(
    <T,>(path: string, body: Record<string, unknown>, requestAuthToken?: string) =>
      request<T>(path, {
        method: "POST",
        headers: mergeHeaders(
          { "Content-Type": "application/json" },
          authorizationHeaders(requestAuthToken)
        ),
        body: JSON.stringify(cleanBody(body)),
      }),
    [request]
  );

  const postTx = useCallback(
    (path: string, body: Record<string, unknown>, requestAuthToken?: string) =>
      postJson<PrivatePaymentTxResponse>(path, body, requestAuthToken),
    [postJson]
  );

  const reset = useCallback(() => {
    requestGenerationRef.current += 1;
    activeRequestsRef.current = 0;
    safeSetState({
      status: "idle",
      isLoading: false,
      error: null,
      lastResponse: null,
      lastRequest: null,
    });
  }, [safeSetState]);

  const clearError = useCallback(() => {
    safeSetState((current) => ({
      ...current,
      status: current.status === "error" ? "idle" : current.status,
      error: null,
    }));
  }, [safeSetState]);

  const health = useCallback(() => request<{ status: "ok" }>("/health"), [request]);

  const deposit = useCallback(
    (params: PrivatePaymentDepositParams) => postTx("/v1/spl/deposit", withDefaults(params)),
    [postTx, withDefaults]
  );

  const transfer = useCallback(
    (params: PrivatePaymentTransferParams) => {
      const { authToken: requestAuthToken, ...body } = params;
      return postTx("/v1/spl/transfer", withDefaults(body), requestAuthToken);
    },
    [postTx, withDefaults]
  );

  const withdraw = useCallback(
    (params: PrivatePaymentWithdrawParams) => postTx("/v1/spl/withdraw", withDefaults(params)),
    [postTx, withDefaults]
  );

  const initializeMint = useCallback(
    (params: PrivatePaymentInitializeMintParams) => postTx("/v1/spl/initialize-mint", withDefaults(params)),
    [postTx, withDefaults]
  );

  const balance = useCallback(
    (params: PrivatePaymentBalanceParams) =>
      request<PrivatePaymentBalance>(
        `/v1/spl/balance${toQuery({
          address: params.address,
          mint: params.mint,
          cluster: params.cluster ?? cluster,
        })}`
      ),
    [cluster, request]
  );

  const privateBalance = useCallback(
    (params: PrivatePaymentPrivateBalanceParams) =>
      request<PrivatePaymentBalance>(
        `/v1/spl/private-balance${toQuery({
          address: params.address,
          mint: params.mint,
          cluster: params.cluster ?? cluster,
        })}`,
        { headers: authorizationHeaders(params.authToken) }
      ),
    [cluster, request]
  );

  const isMintInitialized = useCallback(
    (params: PrivatePaymentIsMintInitializedParams) =>
      request<PrivatePaymentMintInitialization>(
        `/v1/spl/is-mint-initialized${toQuery({
          mint: params.mint,
          cluster: params.cluster ?? cluster,
          validator: params.validator ?? validator,
        })}`
      ),
    [cluster, request, validator]
  );

  const challenge = useCallback(
    (params: PrivatePaymentChallengeParams) =>
      request<{ challenge: string }>(
        `/v1/spl/challenge${toQuery(withCluster(params))}`
      ),
    [request, withCluster]
  );

  const login = useCallback(
    (params: PrivatePaymentLoginParams) =>
      postJson<{ token: string }>("/v1/spl/login", withCluster(params)),
    [postJson, withCluster]
  );

  return useMemo(
    () => ({
      ...state,
      endpoint: endpoint.replace(/\/+$/, ""),
      request,
      reset,
      clearError,
      health,
      deposit,
      transfer,
      withdraw,
      initializeMint,
      balance,
      privateBalance,
      isMintInitialized,
      challenge,
      login,
    }),
    [
      state,
      endpoint,
      request,
      reset,
      clearError,
      health,
      deposit,
      transfer,
      withdraw,
      initializeMint,
      balance,
      privateBalance,
      isMintInitialized,
      challenge,
      login,
    ]
  );
}
