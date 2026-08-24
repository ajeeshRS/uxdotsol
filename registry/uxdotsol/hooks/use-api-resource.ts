"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiResourceStatus = "idle" | "loading" | "success" | "error";

export type ApiResourceError = {
  code: string;
  message: string;
  retryable: boolean;
  status?: number;
};

export type ApiResourceAdapter<Input, Data> = (
  input: Input,
  context: { signal: AbortSignal },
) => Promise<Data>;

export type ApiResourceState<Data> = {
  status: ApiResourceStatus;
  data: Data | null;
  error: ApiResourceError | null;
  updatedAt: string | null;
};

type ApiEnvelope<Data> = {
  data?: Data;
  error?: Partial<ApiResourceError> & { message?: string };
};

export class ApiResourceRequestError extends Error {
  code: string;
  retryable: boolean;
  status?: number;

  constructor(error: ApiResourceError) {
    super(error.message);
    this.name = "ApiResourceRequestError";
    this.code = error.code;
    this.retryable = error.retryable;
    this.status = error.status;
  }
}

export async function readApiResource<Data>(response: Response) {
  let body: ApiEnvelope<Data>;

  try {
    body = (await response.json()) as ApiEnvelope<Data>;
  } catch {
    throw new ApiResourceRequestError({
      code: "INVALID_RESPONSE",
      message: "The provider returned an unreadable response.",
      retryable: true,
      status: response.status,
    });
  }

  if (!response.ok || body.error || body.data === undefined) {
    throw new ApiResourceRequestError({
      code: body.error?.code || "REQUEST_FAILED",
      message: body.error?.message || "The provider request failed.",
      retryable: body.error?.retryable ?? response.status >= 500,
      status: response.status,
    });
  }

  return body.data;
}

function normalizeError(cause: unknown): ApiResourceError {
  if (cause instanceof ApiResourceRequestError) {
    return {
      code: cause.code,
      message: cause.message,
      retryable: cause.retryable,
      status: cause.status,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: cause instanceof Error ? cause.message : "The request failed.",
    retryable: true,
  };
}

export function useApiResource<Input, Data>({
  adapter,
  enabled,
  input,
  requestKey,
}: {
  adapter: ApiResourceAdapter<Input, Data>;
  enabled: boolean;
  input: Input;
  requestKey: string;
}) {
  const inputRef = useRef(input);
  const requestIdRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<ApiResourceState<Data>>({
    status: "idle",
    data: null,
    error: null,
    updatedAt: null,
  });

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (!enabled) return;

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const loadingTimer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        status: "loading",
        error: null,
      }));
    }, 0);

    void adapter(inputRef.current, { signal: controller.signal })
      .then((data) => {
        window.clearTimeout(loadingTimer);
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setState({
          status: "success",
          data,
          error: null,
          updatedAt: new Date().toISOString(),
        });
      })
      .catch((cause: unknown) => {
        window.clearTimeout(loadingTimer);
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setState((current) => ({
          ...current,
          status: "error",
          error: normalizeError(cause),
        }));
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [adapter, enabled, refreshKey, requestKey]);

  const refetch = useCallback(() => setRefreshKey((value) => value + 1), []);
  const visibleState: ApiResourceState<Data> = enabled
    ? state
    : { status: "idle", data: null, error: null, updatedAt: null };

  return {
    ...visibleState,
    isIdle: visibleState.status === "idle",
    isLoading: visibleState.status === "loading",
    isSuccess: visibleState.status === "success",
    isError: visibleState.status === "error",
    refetch,
  };
}
