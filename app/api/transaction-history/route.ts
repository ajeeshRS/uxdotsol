import {
  address as parseAddress,
  createSolanaRpc,
  signature as parseSignature,
  type Address,
} from "@solana/kit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
type ClusterValue = "mainnet-beta" | "devnet" | "testnet";
const CLUSTERS = new Set<ClusterValue>(["mainnet-beta", "devnet", "testnet"]);

function jsonError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

function rpcUrl(cluster: ClusterValue) {
  if (cluster === "mainnet-beta") {
    return process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com";
  }
  if (cluster === "devnet") {
    return process.env.DEVNET_RPC || "https://api.devnet.solana.com";
  }
  return "https://api.testnet.solana.com";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim() ?? "";
  const clusterParam = searchParams.get("cluster") || "mainnet-beta";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
  const before = searchParams.get("before")?.trim() || undefined;
  if (!CLUSTERS.has(clusterParam as ClusterValue)) return jsonError("INVALID_CLUSTER", "Unsupported Solana cluster.", 400);

  let publicKey: Address;
  try {
    publicKey = parseAddress(address);
  } catch {
    return jsonError("INVALID_ADDRESS", "A valid Solana account address is required.", 400);
  }
  let beforeSignature;
  try {
    beforeSignature = before ? parseSignature(before) : undefined;
  } catch {
    return jsonError("INVALID_CURSOR", "The transaction cursor is invalid.", 400);
  }
  const cluster = clusterParam as ClusterValue;

  try {
    const signatures = await createSolanaRpc(rpcUrl(cluster))
      .getSignaturesForAddress(publicKey, {
        before: beforeSignature,
        commitment: "confirmed",
        limit,
      })
      .send();
    const items = signatures.map((item) => ({
      signature: item.signature,
      slot: Number(item.slot),
      blockTime: item.blockTime
        ? new Date(Number(item.blockTime) * 1_000).toISOString()
        : null,
      memo: item.memo,
      status: item.err ? "failed" : item.confirmationStatus || "processed",
      error: item.err,
    }));
    return NextResponse.json({
      data: {
        address,
        cluster,
        items,
        nextCursor: items.at(-1)?.signature ?? null,
      },
    });
  } catch {
    return jsonError("RPC_UNAVAILABLE", `Could not reach the ${cluster} RPC.`, 503, true);
  }
}
