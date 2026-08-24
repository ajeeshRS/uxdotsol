import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JupiterToken = Record<string, unknown>;
const JUPITER_TOKENS_URL = "https://api.jup.ag/tokens/v2/search";

function jsonError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeToken(token: JupiterToken) {
  return {
    mint: typeof token.id === "string" ? token.id : "",
    name: typeof token.name === "string" ? token.name : "Unknown token",
    symbol: typeof token.symbol === "string" ? token.symbol : "UNKNOWN",
    icon: typeof token.icon === "string" ? token.icon : null,
    decimals:
      typeof token.decimals === "number" && Number.isInteger(token.decimals)
        ? token.decimals
        : 0,
    isVerified: typeof token.isVerified === "boolean" ? token.isVerified : null,
    liquidity: optionalNumber(token.liquidity),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12));
  const apiKey = process.env.JUPITER_API_KEY;

  if (query.length < 2) {
    return jsonError("INVALID_QUERY", "Enter at least two search characters.", 400);
  }
  if (!apiKey) {
    return jsonError("MISSING_CONFIGURATION", "Missing JUPITER_API_KEY.", 500);
  }

  const url = new URL(JUPITER_TOKENS_URL);
  url.searchParams.set("query", query);

  try {
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return jsonError(
        "PROVIDER_ERROR",
        response.status === 429
          ? "The token provider is temporarily rate limited."
          : "The token provider request failed.",
        response.status === 429 ? 503 : 502,
        true,
      );
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return jsonError("INVALID_PROVIDER_RESPONSE", "The token provider returned invalid data.", 502, true);
    }
    const tokens = (payload as JupiterToken[])
      .map(normalizeToken)
      .filter((token) => token.mint)
      .slice(0, limit);
    return NextResponse.json({ data: { query, tokens } });
  } catch {
    return jsonError("PROVIDER_UNAVAILABLE", "The token provider is unavailable.", 502, true);
  }
}
