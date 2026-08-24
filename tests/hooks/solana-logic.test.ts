import { describe, expect, it } from "vitest";
import { readApiResource } from "@/registry/uxdotsol/hooks/use-api-resource";
import { validateRecipientAddress } from "@/registry/uxdotsol/hooks/use-recipient-validation";
import { classifySolanaRetry } from "@/registry/uxdotsol/hooks/use-smart-retry";
import {
  assessTokenSafety,
  type TokenSafetyToken,
} from "@/registry/uxdotsol/hooks/use-token-safety";

const ADDRESS_A = "11111111111111111111111111111111";
const ADDRESS_B = "So11111111111111111111111111111111111111112";

const verifiedToken: TokenSafetyToken = {
  mint: ADDRESS_B,
  name: "Wrapped SOL",
  symbol: "SOL",
  icon: null,
  decimals: 9,
  isVerified: true,
  organicScore: 95,
  organicScoreLabel: "high",
  audit: {
    isSus: false,
    mintAuthorityDisabled: true,
    freezeAuthorityDisabled: true,
    topHoldersPercentage: 8,
    devBalancePercentage: 0,
  },
  tags: [],
  liquidity: 1_000_000,
  holderCount: 100_000,
  updatedAt: "2026-08-17T00:00:00.000Z",
};

describe("recipient validation", () => {
  it("rejects malformed addresses", () => {
    const result = validateRecipientAddress("not-a-solana-address");

    expect(result.status).toBe("invalid");
    expect(result.reasons).toEqual([
      expect.objectContaining({ code: "invalid-address", severity: "danger" }),
    ]);
  });

  it("blocks self-transfers by default and can downgrade them to warnings", () => {
    expect(
      validateRecipientAddress(ADDRESS_A, { sender: ADDRESS_A }).status,
    ).toBe("blocked");
    expect(
      validateRecipientAddress(ADDRESS_A, {
        sender: ADDRESS_A,
        allowSelf: true,
      }).status,
    ).toBe("warning");
  });

  it("gives the block list precedence over the trust list", () => {
    const result = validateRecipientAddress(ADDRESS_B, {
      blockedAddresses: [ADDRESS_B],
      trustedAddresses: [ADDRESS_B],
    });

    expect(result.status).toBe("blocked");
    expect(result.reasons[0]?.code).toBe("blocked-address");
  });
});

describe("token safety assessment", () => {
  it("marks a verified token with no warnings as safe", () => {
    expect(assessTokenSafety(verifiedToken)).toEqual({
      risk: "safe",
      reasons: [expect.objectContaining({ code: "verified" })],
    });
  });

  it("prioritizes danger signals over verification", () => {
    const result = assessTokenSafety({
      ...verifiedToken,
      audit: { ...verifiedToken.audit, isSus: true },
      tags: ["BANNED"],
    });

    expect(result.risk).toBe("danger");
    expect(result.reasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(["suspicious", "banned"]),
    );
  });

  it("flags concentration at the documented 20 percent boundary", () => {
    const result = assessTokenSafety({
      ...verifiedToken,
      audit: { ...verifiedToken.audit, topHoldersPercentage: 20 },
    });

    expect(result.risk).toBe("caution");
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ code: "concentrated-holders" }),
    );
  });
});

describe("retry classification", () => {
  it.each([
    ["Blockhash not found", "blockhash-expired", true, true],
    ["HTTP 429 Too Many Requests", "rate-limited", true, false],
    ["RPC node is unhealthy", "node-unhealthy", true, true],
    ["Failed to fetch", "transport", true, false],
    ["Transaction simulation failed", "simulation-failed", false, false],
    ["custom program error", "unknown", false, false],
  ] as const)(
    "classifies %s",
    (message, reason, retryable, refreshBlockhash) => {
      expect(classifySolanaRetry(new Error(message))).toEqual({
        reason,
        retryable,
        refreshBlockhash,
      });
    },
  );
});

describe("API response normalization", () => {
  it("returns successful envelope data", async () => {
    const response = new Response(JSON.stringify({ data: { value: 42 } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    await expect(readApiResource<{ value: number }>(response)).resolves.toEqual({
      value: 42,
    });
  });

  it("preserves provider error metadata", async () => {
    const response = new Response(
      JSON.stringify({
        error: { code: "RATE_LIMITED", message: "Slow down", retryable: true },
      }),
      { status: 429, headers: { "content-type": "application/json" } },
    );

    await expect(readApiResource(response)).rejects.toMatchObject({
      name: "ApiResourceRequestError",
      code: "RATE_LIMITED",
      message: "Slow down",
      retryable: true,
      status: 429,
    });
  });

  it("rejects unreadable provider responses", async () => {
    const response = new Response("not-json", { status: 502 });

    await expect(readApiResource(response)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      retryable: true,
      status: 502,
    });
  });
});
