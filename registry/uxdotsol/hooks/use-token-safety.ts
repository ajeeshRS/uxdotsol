"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TokenSafetyRisk = "safe" | "caution" | "danger" | "unknown";
export type TokenSafetyStatus =
  | "idle"
  | "loading"
  | "success"
  | "not-found"
  | "error";

export type TokenSafetyAudit = {
  isSus?: boolean;
  mintAuthorityDisabled?: boolean;
  freezeAuthorityDisabled?: boolean;
  topHoldersPercentage?: number;
  devBalancePercentage?: number;
};

export type TokenSafetyToken = {
  mint: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  isVerified: boolean | null;
  organicScore: number | null;
  organicScoreLabel: "high" | "medium" | "low" | null;
  audit: TokenSafetyAudit | null;
  tags: string[];
  liquidity: number | null;
  holderCount: number | null;
  updatedAt: string | null;
};

export type TokenSafetyReasonCode =
  | "suspicious"
  | "banned"
  | "unverified"
  | "low-organic-activity"
  | "mint-authority-enabled"
  | "freeze-authority-enabled"
  | "concentrated-holders"
  | "concentrated-developer-balance"
  | "verified";

export type TokenSafetyReason = {
  code: TokenSafetyReasonCode;
  severity: "info" | "warning" | "danger";
  message: string;
};

export type TokenSafetyAssessment = {
  risk: TokenSafetyRisk;
  reasons: TokenSafetyReason[];
};

export type TokenSafetyAdapterContext = {
  signal?: AbortSignal;
};

export type TokenSafetyAdapter = {
  getToken: (
    mint: string,
    context?: TokenSafetyAdapterContext,
  ) => Promise<TokenSafetyToken | null>;
};

export type TokenSafetyHttpAdapterConfig = {
  endpoint?: string;
  fetcher?: typeof fetch;
  headers?: HeadersInit;
};

export type TokenSafetyAssessor = (
  token: TokenSafetyToken,
) => TokenSafetyAssessment;

export type TokenSafetyOptions = TokenSafetyHttpAdapterConfig & {
  adapter?: TokenSafetyAdapter;
  assess?: TokenSafetyAssessor;
  enabled?: boolean;
};

export type TokenSafetyValue = TokenSafetyAssessment & {
  token: TokenSafetyToken | null;
  status: TokenSafetyStatus;
  isLoading: boolean;
  isVerified: boolean;
  isSuspicious: boolean;
  error: Error | null;
  refetch: () => void;
};

const DEFAULT_ENDPOINT = "/api/token-safety";
const CONCENTRATION_WARNING_PERCENTAGE = 20;

function warning(
  code: TokenSafetyReasonCode,
  message: string,
): TokenSafetyReason {
  return { code, severity: "warning", message };
}

/** Converts normalized token metadata into UI-oriented safety states. */
export function assessTokenSafety(
  token: TokenSafetyToken,
): TokenSafetyAssessment {
  const reasons: TokenSafetyReason[] = [];
  const tags = new Set(token.tags.map((tag) => tag.toLowerCase()));

  if (token.audit?.isSus) {
    reasons.push({
      code: "suspicious",
      severity: "danger",
      message: "This token is flagged as suspicious.",
    });
  }

  if (tags.has("banned")) {
    reasons.push({
      code: "banned",
      severity: "danger",
      message: "This token is marked as banned.",
    });
  }

  if (token.isVerified !== true) {
    reasons.push(
      warning("unverified", "This token has not been verified."),
    );
  }

  if (token.organicScoreLabel === "low") {
    reasons.push(
      warning(
        "low-organic-activity",
        "This token has a low organic activity score.",
      ),
    );
  }

  if (token.audit?.mintAuthorityDisabled === false) {
    reasons.push(
      warning(
        "mint-authority-enabled",
        "The mint authority can create additional supply.",
      ),
    );
  }

  if (token.audit?.freezeAuthorityDisabled === false) {
    reasons.push(
      warning(
        "freeze-authority-enabled",
        "The freeze authority can freeze token accounts.",
      ),
    );
  }

  if (
    typeof token.audit?.topHoldersPercentage === "number" &&
    token.audit.topHoldersPercentage >= CONCENTRATION_WARNING_PERCENTAGE
  ) {
    reasons.push(
      warning(
        "concentrated-holders",
        `Top holders control ${token.audit.topHoldersPercentage.toFixed(1)}% of supply.`,
      ),
    );
  }

  if (
    typeof token.audit?.devBalancePercentage === "number" &&
    token.audit.devBalancePercentage >= CONCENTRATION_WARNING_PERCENTAGE
  ) {
    reasons.push(
      warning(
        "concentrated-developer-balance",
        `The developer controls ${token.audit.devBalancePercentage.toFixed(1)}% of supply.`,
      ),
    );
  }

  if (reasons.some((reason) => reason.severity === "danger")) {
    return { risk: "danger", reasons };
  }

  if (reasons.some((reason) => reason.severity === "warning")) {
    return { risk: "caution", reasons };
  }

  if (token.isVerified) {
    reasons.push({
      code: "verified",
      severity: "info",
      message: "This token is verified and has no detected warnings.",
    });
    return { risk: "safe", reasons };
  }

  return { risk: "unknown", reasons };
}

function isTokenSafetyToken(value: unknown): value is TokenSafetyToken {
  if (!value || typeof value !== "object") return false;
  const token = value as Partial<TokenSafetyToken>;

  return (
    typeof token.mint === "string" &&
    typeof token.name === "string" &&
    typeof token.symbol === "string" &&
    typeof token.decimals === "number"
  );
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string"
      ? payload.error
      : `Token safety request failed with status ${response.status}.`;
  } catch {
    return `Token safety request failed with status ${response.status}.`;
  }
}

/** Creates the default same-origin HTTP adapter used by the hook. */
export function createTokenSafetyHttpAdapter({
  endpoint = DEFAULT_ENDPOINT,
  fetcher = fetch,
  headers,
}: TokenSafetyHttpAdapterConfig = {}): TokenSafetyAdapter {
  return {
    async getToken(mint, context) {
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("mint", mint);

      const response = await fetcher(url, {
        headers,
        signal: context?.signal,
        cache: "no-store",
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error(await readErrorMessage(response));

      const token = (await response.json()) as unknown;
      if (!isTokenSafetyToken(token)) {
        throw new Error("Token safety endpoint returned an invalid response.");
      }

      return token;
    },
  };
}

const EMPTY_ASSESSMENT: TokenSafetyAssessment = {
  risk: "unknown",
  reasons: [],
};

/** Loads token metadata and exposes normalized safety states for financial UI. */
export function useTokenSafety(
  mint: string | null | undefined,
  options: TokenSafetyOptions = {},
): TokenSafetyValue {
  const {
    adapter,
    assess = assessTokenSafety,
    enabled = true,
    endpoint,
    fetcher,
    headers,
  } = options;
  const normalizedMint = mint?.trim() ?? "";
  const [status, setStatus] = useState<TokenSafetyStatus>("idle");
  const [token, setToken] = useState<TokenSafetyToken | null>(null);
  const [assessment, setAssessment] =
    useState<TokenSafetyAssessment>(EMPTY_ASSESSMENT);
  const [error, setError] = useState<Error | null>(null);
  const [requestId, setRequestId] = useState(0);
  const generationRef = useRef(0);
  const httpAdapter = useMemo(
    () => createTokenSafetyHttpAdapter({ endpoint, fetcher, headers }),
    [endpoint, fetcher, headers],
  );
  const client = adapter ?? httpAdapter;

  const refetch = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    const controller = new AbortController();

    if (!enabled || !normalizedMint) {
      return () => controller.abort();
    }

    const loadingTimer = window.setTimeout(() => {
      setStatus("loading");
      setToken(null);
      setAssessment(EMPTY_ASSESSMENT);
      setError(null);
    }, 0);

    void client
      .getToken(normalizedMint, { signal: controller.signal })
      .then((nextToken) => {
        window.clearTimeout(loadingTimer);
        if (controller.signal.aborted || generation !== generationRef.current) {
          return;
        }

        if (!nextToken) {
          setStatus("not-found");
          return;
        }

        setToken(nextToken);
        setAssessment(assess(nextToken));
        setStatus("success");
      })
      .catch((cause) => {
        window.clearTimeout(loadingTimer);
        if (controller.signal.aborted || generation !== generationRef.current) {
          return;
        }

        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setStatus("error");
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [assess, client, enabled, normalizedMint, requestId]);

  const isEnabled = enabled && Boolean(normalizedMint);
  const visibleStatus = isEnabled ? status : "idle";
  const visibleToken = isEnabled ? token : null;
  const visibleAssessment = isEnabled ? assessment : EMPTY_ASSESSMENT;
  const visibleError = isEnabled ? error : null;

  return useMemo(
    () => ({
      token: visibleToken,
      ...visibleAssessment,
      status: visibleStatus,
      isLoading: visibleStatus === "loading",
      isVerified: visibleToken?.isVerified === true,
      isSuspicious:
        visibleToken?.audit?.isSus === true ||
        visibleToken?.tags.some((tag) => tag.toLowerCase() === "banned") ===
          true,
      error: visibleError,
      refetch,
    }),
    [
      refetch,
      visibleAssessment,
      visibleError,
      visibleStatus,
      visibleToken,
    ],
  );
}
