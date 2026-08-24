import { NextResponse } from "next/server";

export const runtime = "nodejs";
const JUPITER_QUOTE_URL = "https://api.jup.ag/swap/v1/quote";
const BASE58_PUBLIC_KEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function jsonError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inputMint = searchParams.get("inputMint")?.trim() ?? "";
  const outputMint = searchParams.get("outputMint")?.trim() ?? "";
  const amount = searchParams.get("amount")?.trim() ?? "";
  const slippageBps = Math.min(5_000, Math.max(0, Number(searchParams.get("slippageBps")) || 50));
  const swapMode = searchParams.get("swapMode") === "ExactOut" ? "ExactOut" : "ExactIn";
  const apiKey = process.env.JUPITER_API_KEY;

  if (!BASE58_PUBLIC_KEY.test(inputMint) || !BASE58_PUBLIC_KEY.test(outputMint)) {
    return jsonError("INVALID_MINT", "Valid input and output token mints are required.", 400);
  }
  if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
    return jsonError("INVALID_AMOUNT", "Amount must be a positive integer in atomic units.", 400);
  }
  if (!apiKey) return jsonError("MISSING_CONFIGURATION", "Missing JUPITER_API_KEY.", 500);

  const url = new URL(JUPITER_QUOTE_URL);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount);
  url.searchParams.set("slippageBps", String(slippageBps));
  url.searchParams.set("swapMode", swapMode);

  try {
    const response = await fetch(url, { headers: { "x-api-key": apiKey }, cache: "no-store" });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      return jsonError("QUOTE_UNAVAILABLE", "No executable payment quote is available.", 502, true);
    }
    const routePlan = Array.isArray(payload.routePlan) ? payload.routePlan : [];
    const routeLabels = routePlan.flatMap((route) => {
      if (!route || typeof route !== "object") return [];
      const swapInfo = (route as Record<string, unknown>).swapInfo;
      if (!swapInfo || typeof swapInfo !== "object") return [];
      const label = (swapInfo as Record<string, unknown>).label;
      return typeof label === "string" ? [label] : [];
    });
    return NextResponse.json({
      data: {
        inputMint,
        outputMint,
        inputAmount: String(payload.inAmount ?? amount),
        outputAmount: String(payload.outAmount ?? "0"),
        minimumOutputAmount: String(payload.otherAmountThreshold ?? "0"),
        swapMode,
        slippageBps,
        priceImpactPct: String(payload.priceImpactPct ?? "0"),
        routeLabels,
        contextSlot: typeof payload.contextSlot === "number" ? payload.contextSlot : null,
      },
    });
  } catch {
    return jsonError("PROVIDER_UNAVAILABLE", "The quote provider is unavailable.", 502, true);
  }
}
