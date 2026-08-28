import { createSolanaRpc, signature as parseSignature } from "@solana/kit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
type ClusterValue = "mainnet-beta" | "devnet" | "testnet";
const CLUSTERS = new Set<ClusterValue>(["mainnet-beta", "devnet", "testnet"]);
const SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

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
  const signature = searchParams.get("signature")?.trim() ?? "";
  const clusterParam = searchParams.get("cluster") || "mainnet-beta";
  if (!SIGNATURE.test(signature)) return jsonError("INVALID_SIGNATURE", "A valid transaction signature is required.", 400);
  if (!CLUSTERS.has(clusterParam as ClusterValue)) return jsonError("INVALID_CLUSTER", "Unsupported Solana cluster.", 400);
  const cluster = clusterParam as ClusterValue;
  let transactionSignature;
  try {
    transactionSignature = parseSignature(signature);
  } catch {
    return jsonError("INVALID_SIGNATURE", "A valid transaction signature is required.", 400);
  }

  try {
    const response = await createSolanaRpc(rpcUrl(cluster)).getSignatureStatuses(
      [transactionSignature],
      { searchTransactionHistory: true },
    ).send();
    const value = response.value[0];
    const status = !value
      ? "not_found"
      : value.err
        ? "failed"
        : value.confirmationStatus || "processed";
    return NextResponse.json({
      data: {
        signature,
        cluster,
        status,
        slot: value ? Number(value.slot) : null,
        confirmations: value?.confirmations === null || value?.confirmations === undefined
          ? null
          : Number(value.confirmations),
        error: value?.err ?? null,
      },
    });
  } catch {
    return jsonError("RPC_UNAVAILABLE", `Could not reach the ${cluster} RPC.`, 503, true);
  }
}
