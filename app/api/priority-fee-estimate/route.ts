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

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0;
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * ratio))];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clusterParam = searchParams.get("cluster") || "mainnet-beta";
  if (!CLUSTERS.has(clusterParam as ClusterValue)) {
    return jsonError("INVALID_CLUSTER", "Unsupported Solana cluster.", 400);
  }

  let accounts: PublicKey[];
  try {
    accounts = searchParams.getAll("account").slice(0, 128).map((value) => new PublicKey(value));
  } catch {
    return jsonError("INVALID_ACCOUNT", "A writable account address is invalid.", 400);
  }

  const cluster = clusterParam as ClusterValue;
  try {
    const samples = await new Connection(rpcUrl(cluster), "confirmed").getRecentPrioritizationFees(
      accounts.length > 0 ? { lockedWritableAccounts: accounts } : undefined,
    );
    const values = samples
      .map((sample) => sample.prioritizationFee)
      .filter((value) => Number.isFinite(value) && value >= 0)
      .sort((a, b) => a - b);
    return NextResponse.json({
      data: {
        cluster,
        unit: "microLamportsPerComputeUnit",
        low: percentile(values, 0.25),
        medium: percentile(values, 0.5),
        high: percentile(values, 0.75),
        sampleSize: values.length,
        slot: samples.at(-1)?.slot ?? null,
      },
    });
  } catch {
    return jsonError("RPC_UNAVAILABLE", `Could not reach the ${cluster} RPC.`, 503, true);
  }
}
