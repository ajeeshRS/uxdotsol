import { NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const runtime = "nodejs";

type ClusterValue = "mainnet-beta" | "devnet" | "testnet";

const CLUSTERS = new Set<ClusterValue>(["mainnet-beta", "devnet", "testnet"]);
const LAMPORTS_PER_SOL_BIGINT = BigInt(LAMPORTS_PER_SOL);
const DISPLAY_DECIMALS = BigInt(100_000);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function formatSol(lamports: number | bigint) {
  const value = BigInt(lamports);
  const whole = value / LAMPORTS_PER_SOL_BIGINT;
  const fraction = value % LAMPORTS_PER_SOL_BIGINT;
  const decimals = ((fraction * DISPLAY_DECIMALS) / LAMPORTS_PER_SOL_BIGINT)
    .toString()
    .padStart(5, "0");

  return `${whole.toLocaleString("en")}.${decimals}`;
}

function getRpcUrl(cluster: ClusterValue) {
  if (cluster === "mainnet-beta") return process.env.MAINNET_RPC || clusterApiUrl(cluster);
  if (cluster === "devnet") return process.env.DEVNET_RPC || clusterApiUrl(cluster);
  return clusterApiUrl(cluster);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const clusterParam = searchParams.get("cluster") || "mainnet-beta";

  if (!address) return jsonError("Missing wallet address.", 400);
  if (!CLUSTERS.has(clusterParam as ClusterValue)) {
    return jsonError("Unsupported cluster.", 400);
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(address);
  } catch {
    return jsonError("Invalid wallet address.", 400);
  }

  const cluster = clusterParam as ClusterValue;
  const connection = new Connection(getRpcUrl(cluster), "confirmed");

  try {
    const [accountInfo, lamports] = await Promise.all([
      connection.getAccountInfo(publicKey),
      connection.getBalance(publicKey),
    ]);

    if (!accountInfo) {
      return NextResponse.json({
        accountExists: false,
        balance: "0.00000",
      });
    }

    return NextResponse.json({
      accountExists: true,
      balance: formatSol(lamports),
    });
  } catch {
    return jsonError(
      `Could not reach the ${cluster} RPC. Configure ${cluster === "mainnet-beta" ? "MAINNET_RPC" : "DEVNET_RPC"} or retry.`,
      503,
    );
  }
}
