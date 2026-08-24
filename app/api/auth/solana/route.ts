import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { verifySignIn } from "@solana/wallet-standard-util";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CHALLENGE_COOKIE = "solana-auth-challenge";
const SESSION_COOKIE = "solana-auth-session";
const CHALLENGE_TTL_SECONDS = 5 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_SIGNED_MESSAGE_BYTES = 4_096;
const DEVELOPMENT_SECRET = randomBytes(32).toString("hex");
const ALLOWED_CHAINS = new Set([
  "mainnet",
  "testnet",
  "devnet",
  "localnet",
  "solana:mainnet",
  "solana:testnet",
  "solana:devnet",
]);

type ChallengePayload = {
  input: SolanaSignInInput;
  expiresAt: number;
};

type SessionPayload = {
  address: string;
  expiresAt: number;
};

type SerializedOutput = {
  account?: {
    address?: unknown;
    publicKey?: unknown;
    chains?: unknown;
    features?: unknown;
  };
  signedMessage?: unknown;
  signature?: unknown;
  signatureType?: unknown;
};

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { authenticated: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getSecret() {
  const secret = process.env.SOLANA_AUTH_SECRET;
  if (secret && secret.length < 32) {
    throw new Error("SOLANA_AUTH_SECRET must contain at least 32 characters.");
  }
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_SECRET;
  throw new Error("SOLANA_AUTH_SECRET is required in production.");
}

function getAuthOrigin(request: NextRequest) {
  const configuredOrigin = process.env.SOLANA_AUTH_ORIGIN?.trim();
  const origin = new URL(configuredOrigin || request.url);
  if (origin.protocol !== "https:" && origin.protocol !== "http:") {
    throw new Error("SOLANA_AUTH_ORIGIN must use http or https.");
  }
  return new URL(origin.origin);
}

function getChainId() {
  const chainId = process.env.SOLANA_AUTH_CHAIN_ID?.trim() || "mainnet";
  if (!ALLOWED_CHAINS.has(chainId)) {
    throw new Error("SOLANA_AUTH_CHAIN_ID is not supported by SIWS.");
  }
  return chainId;
}

function seal(payload: object) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function unseal<T>(token: string | undefined): T | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const encoded = token.slice(0, separator);
  const provided = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = createHmac("sha256", getSecret()).update(encoded).digest();
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function isSameOrigin(request: NextRequest, expectedOrigin: URL) {
  const requestOrigin = request.headers.get("origin");
  return !requestOrigin || requestOrigin === expectedOrigin.origin;
}

function cookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.NODE_ENV === "production" ||
      getAuthOrigin(request).protocol === "https:",
    path: "/",
    maxAge,
  };
}

function toBytes(
  value: unknown,
  field: string,
  options: { exact?: number; max?: number },
) {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !Number.isInteger(item) || (item as number) < 0 || (item as number) > 255,
    )
  ) {
    throw new Error(`${field} must be a byte array.`);
  }
  if (options.exact !== undefined && value.length !== options.exact) {
    throw new Error(`${field} has an invalid length.`);
  }
  if (options.max !== undefined && value.length > options.max) {
    throw new Error(`${field} is too large.`);
  }
  return new Uint8Array(value as number[]);
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.length <= 100,
  );
}

function deserializeOutput(value: unknown): SolanaSignInOutput {
  if (!value || typeof value !== "object") {
    throw new Error("Missing sign-in output.");
  }

  const serialized = value as SerializedOutput;
  const address = serialized.account?.address;
  if (typeof address !== "string" || address.length < 32 || address.length > 44) {
    throw new Error("The wallet address is invalid.");
  }
  if (
    serialized.signatureType !== undefined &&
    serialized.signatureType !== "ed25519"
  ) {
    throw new Error("Only Ed25519 signatures are supported.");
  }

  return {
    account: {
      address,
      publicKey: toBytes(serialized.account?.publicKey, "Public key", {
        exact: 32,
      }),
      chains: toStringArray(serialized.account?.chains) as `${string}:${string}`[],
      features: toStringArray(
        serialized.account?.features,
      ) as `${string}:${string}`[],
    },
    signedMessage: toBytes(serialized.signedMessage, "Signed message", {
      max: MAX_SIGNED_MESSAGE_BYTES,
    }),
    signature: toBytes(serialized.signature, "Signature", { exact: 64 }),
    signatureType: "ed25519",
  };
}

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.has("session")) {
      const session = unseal<SessionPayload>(
        request.cookies.get(SESSION_COOKIE)?.value,
      );
      if (!session || session.expiresAt <= Date.now()) {
        const response = NextResponse.json(
          { authenticated: false },
          { headers: { "Cache-Control": "no-store" } },
        );
        response.cookies.delete(SESSION_COOKIE);
        return response;
      }

      return NextResponse.json(
        {
          authenticated: true,
          session: {
            address: session.address,
            expiresAt: new Date(session.expiresAt).toISOString(),
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const origin = getAuthOrigin(request);
    const now = new Date();
    const expiresAt = now.getTime() + CHALLENGE_TTL_SECONDS * 1_000;
    const input: SolanaSignInInput = {
      domain: origin.host,
      uri: origin.origin,
      statement:
        process.env.SOLANA_AUTH_STATEMENT?.trim() ||
        "Sign in to prove you control this wallet. This request will not trigger a blockchain transaction or cost a fee.",
      version: "1",
      chainId: getChainId(),
      nonce: randomBytes(16).toString("hex"),
      issuedAt: now.toISOString(),
      expirationTime: new Date(expiresAt).toISOString(),
    };

    const response = NextResponse.json(
      { input },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      CHALLENGE_COOKIE,
      seal({ input, expiresAt } satisfies ChallengePayload),
      cookieOptions(request, CHALLENGE_TTL_SECONDS),
    );
    return response;
  } catch (cause) {
    return jsonError(
      cause instanceof Error ? cause.message : "Could not create a challenge.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = getAuthOrigin(request);
    if (!isSameOrigin(request, origin)) {
      return jsonError("Cross-origin authentication is not allowed.", 403);
    }

    const challenge = unseal<ChallengePayload>(
      request.cookies.get(CHALLENGE_COOKIE)?.value,
    );
    if (!challenge || challenge.expiresAt <= Date.now()) {
      return jsonError("The sign-in challenge expired. Please try again.", 401);
    }

    const body = (await request.json()) as { output?: unknown };
    const output = deserializeOutput(body.output);
    const verificationInput: SolanaSignInInput = {
      ...challenge.input,
      address: output.account.address,
    };
    if (!verifySignIn(verificationInput, output)) {
      return jsonError("The wallet signature could not be verified.", 401);
    }

    const session: SessionPayload = {
      address: output.account.address,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1_000,
    };
    const response = NextResponse.json(
      {
        authenticated: true,
        session: {
          address: session.address,
          expiresAt: new Date(session.expiresAt).toISOString(),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.delete(CHALLENGE_COOKIE);
    response.cookies.set(
      SESSION_COOKIE,
      seal(session),
      cookieOptions(request, SESSION_TTL_SECONDS),
    );
    return response;
  } catch (cause) {
    return jsonError(
      cause instanceof Error ? cause.message : "Could not verify the signature.",
      400,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const origin = getAuthOrigin(request);
    if (!isSameOrigin(request, origin)) {
      return jsonError("Cross-origin sign out is not allowed.", 403);
    }

    const response = NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.delete(CHALLENGE_COOKIE);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (cause) {
    return jsonError(
      cause instanceof Error ? cause.message : "Could not sign out.",
      500,
    );
  }
}
