import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JupiterToken = Record<string, unknown>;
const JUPITER_TOKENS_URL = "https://api.jup.ag/tokens/v2/search";
const BASE58_PUBLIC_KEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function jsonError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeToken(token: JupiterToken) {
  return {
    mint: token.id,
    name: typeof token.name === "string" ? token.name : "Unknown token",
    symbol: typeof token.symbol === "string" ? token.symbol : "UNKNOWN",
    icon: typeof token.icon === "string" ? token.icon : null,
    decimals:
      typeof token.decimals === "number" && Number.isInteger(token.decimals)
        ? token.decimals
        : 0,
    isVerified: typeof token.isVerified === "boolean" ? token.isVerified : null,
    tags: Array.isArray(token.tags)
      ? token.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    liquidity: optionalNumber(token.liquidity),
    holderCount: optionalNumber(token.holderCount),
  };
}

export async function GET(request: Request) {
  const mint = new URL(request.url).searchParams.get("mint")?.trim() ?? "";
  const apiKey = process.env.JUPITER_API_KEY;
  if (!BASE58_PUBLIC_KEY.test(mint)) {
    return jsonError("INVALID_MINT", "A valid Solana token mint is required.", 400);
  }
  if (!apiKey) {
    return jsonError("MISSING_CONFIGURATION", "Missing JUPITER_API_KEY.", 500);
  }

  const url = new URL(JUPITER_TOKENS_URL);
  url.searchParams.set("query", mint);

  try {
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return jsonError("PROVIDER_ERROR", "The token metadata request failed.", 502, true);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return jsonError("INVALID_PROVIDER_RESPONSE", "The token provider returned invalid data.", 502, true);
    }
    const token = (payload as JupiterToken[]).find((item) => item.id === mint);
    if (!token) return jsonError("TOKEN_NOT_FOUND", "Token metadata was not found.", 404);
    return NextResponse.json({ data: normalizeToken(token) });
  } catch {
    return jsonError("PROVIDER_UNAVAILABLE", "The token provider is unavailable.", 502, true);
  }
}
