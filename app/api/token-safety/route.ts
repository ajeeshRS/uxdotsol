import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JupiterToken = {
  id?: unknown;
  name?: unknown;
  symbol?: unknown;
  icon?: unknown;
  decimals?: unknown;
  isVerified?: unknown;
  organicScore?: unknown;
  organicScoreLabel?: unknown;
  audit?: unknown;
  tags?: unknown;
  liquidity?: unknown;
  holderCount?: unknown;
  updatedAt?: unknown;
};

const JUPITER_TOKENS_URL = "https://api.jup.ag/tokens/v2/search";
const BASE58_PUBLIC_KEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeAudit(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const audit = value as Record<string, unknown>;

  return {
    isSus: optionalBoolean(audit.isSus),
    mintAuthorityDisabled: optionalBoolean(audit.mintAuthorityDisabled),
    freezeAuthorityDisabled: optionalBoolean(audit.freezeAuthorityDisabled),
    topHoldersPercentage:
      optionalNumber(audit.topHoldersPercentage) ?? undefined,
    devBalancePercentage:
      optionalNumber(audit.devBalancePercentage) ?? undefined,
  };
}

function normalizeToken(token: JupiterToken) {
  const label = token.organicScoreLabel;

  return {
    mint: token.id,
    name: typeof token.name === "string" ? token.name : "Unknown token",
    symbol: typeof token.symbol === "string" ? token.symbol : "UNKNOWN",
    icon: typeof token.icon === "string" ? token.icon : null,
    decimals:
      typeof token.decimals === "number" && Number.isInteger(token.decimals)
        ? token.decimals
        : 0,
    isVerified:
      typeof token.isVerified === "boolean" ? token.isVerified : null,
    organicScore: optionalNumber(token.organicScore),
    organicScoreLabel:
      label === "high" || label === "medium" || label === "low" ? label : null,
    audit: normalizeAudit(token.audit),
    tags: Array.isArray(token.tags)
      ? token.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    liquidity: optionalNumber(token.liquidity),
    holderCount: optionalNumber(token.holderCount),
    updatedAt: typeof token.updatedAt === "string" ? token.updatedAt : null,
  };
}

export async function GET(request: Request) {
  const mint = new URL(request.url).searchParams.get("mint")?.trim();
  const apiKey = process.env.JUPITER_API_KEY;

  if (!mint || !BASE58_PUBLIC_KEY.test(mint)) {
    return jsonError("A valid Solana token mint is required.", 400);
  }

  if (!apiKey) {
    return jsonError("Missing JUPITER_API_KEY.", 500);
  }

  const url = new URL(JUPITER_TOKENS_URL);
  url.searchParams.set("query", mint);

  try {
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return jsonError(
        response.status === 429
          ? "Token safety provider is temporarily rate limited."
          : "Token safety provider request failed.",
        response.status === 429 ? 503 : 502,
      );
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return jsonError("Token safety provider returned an invalid response.", 502);
    }

    const token = (payload as JupiterToken[]).find((item) => item.id === mint);
    if (!token) return jsonError("Token not found.", 404);

    return NextResponse.json(normalizeToken(token));
  } catch {
    return jsonError("Token safety provider is unavailable.", 502);
  }
}
