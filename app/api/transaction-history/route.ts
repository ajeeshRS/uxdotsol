import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
type ClusterValue = "mainnet-beta" | "devnet" | "testnet";
const CLUSTERS = new Set<ClusterValue>(["mainnet-beta", "devnet", "testnet"]);

function jsonError(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json({ error: { code, message, retryable } }, { status });
}

function rpcUrl(cluster: ClusterValue) {
  if (cluster === "mainnet-beta") return process.env.MAINNET_RPC || clusterApiUrl(cluster);
  if (cluster === "devnet") return process.env.DEVNET_RPC || clusterApiUrl(cluster);
  return clusterApiUrl(cluster);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim() ?? "";
  const clusterParam = searchParams.get("cluster") || "mainnet-beta";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
  const before = searchParams.get("before")?.trim() || undefined;
  if (!CLUSTERS.has(clusterParam as ClusterValue)) return jsonError("INVALID_CLUSTER", "Unsupported Solana cluster.", 400);

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(address);
  } catch {
    return jsonError("INVALID_ADDRESS", "A valid Solana account address is required.", 400);
  }
  const cluster = clusterParam as ClusterValue;

  try {
    const signatures = await new Connection(rpcUrl(cluster), "confirmed").getSignaturesForAddress(
      publicKey,
      { before, limit },
      "confirmed",
    );
    const items = signatures.map((item) => ({
      signature: item.signature,
      slot: item.slot,
      blockTime: item.blockTime ? new Date(item.blockTime * 1_000).toISOString() : null,
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
