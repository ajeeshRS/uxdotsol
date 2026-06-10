import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string | null;
};

type CoinGeckoMarketChart = {
  prices?: [number, number][];
};

const DEFAULT_COIN_ID = "solana";
const DEFAULT_VS_CURRENCY = "usd";

function normalizeCoinId(value: string | null) {
  const tokenName = value?.trim();
  return (tokenName || DEFAULT_COIN_ID).toLowerCase().replace(/\s+/g, "-");
}

function getCoinGeckoConfig() {
  const apiKey = process.env.COINGECKO_API_KEY;
  const plan = process.env.COINGECKO_API_PLAN?.toLowerCase() === "pro" ? "pro" : "demo";

  return {
    apiKey,
    baseUrl:
      plan === "pro"
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3",
    headerName: plan === "pro" ? "x-cg-pro-api-key" : "x-cg-demo-api-key",
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function compactCurrency(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coinId = normalizeCoinId(searchParams.get("tokenName") || searchParams.get("coinId"));
  const vsCurrency = searchParams.get("vsCurrency") || DEFAULT_VS_CURRENCY;
  const { apiKey, baseUrl, headerName } = getCoinGeckoConfig();

  if (!apiKey) {
    return jsonError("Missing COINGECKO_API_KEY.", 500);
  }

  const headers = { [headerName]: apiKey };
  const marketUrl = new URL(`${baseUrl}/coins/markets`);
  marketUrl.searchParams.set("vs_currency", vsCurrency);
  marketUrl.searchParams.set("ids", coinId);
  marketUrl.searchParams.set("price_change_percentage", "24h");

  const chartUrl = new URL(`${baseUrl}/coins/${coinId}/market_chart`);
  chartUrl.searchParams.set("vs_currency", vsCurrency);
  chartUrl.searchParams.set("days", "1");

  const [marketResponse, chartResponse] = await Promise.all([
    fetch(marketUrl, { headers, next: { revalidate: 30 } }),
    fetch(chartUrl, { headers, next: { revalidate: 30 } }),
  ]);

  if (!marketResponse.ok || !chartResponse.ok) {
    return jsonError("CoinGecko request failed.", 502);
  }

  const [markets, chart] = (await Promise.all([
    marketResponse.json(),
    chartResponse.json(),
  ])) as [CoinGeckoMarket[], CoinGeckoMarketChart];

  const market = markets[0];
  const prices =
    chart.prices?.flatMap((point) => {
      if (point.length !== 2 || !Number.isFinite(point[1])) {
        return [];
      }

      const [timestamp, price] = point;
      return [
        {
          timestamp,
          time: new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          price,
        },
      ];
    }) ?? [];

  if (!market || prices.length === 0 || typeof market.current_price !== "number") {
    return jsonError("CoinGecko returned incomplete price data.", 502);
  }

  return NextResponse.json({
    id: market.id,
    symbol: market.symbol.toUpperCase(),
    name: market.name,
    image: market.image,
    currentPrice: market.current_price,
    changePercent24h: market.price_change_percentage_24h ?? 0,
    high24h: market.high_24h,
    low24h: market.low_24h,
    marketCap: compactCurrency(market.market_cap),
    volume24h: compactCurrency(market.total_volume),
    rank: market.market_cap_rank ? `#${market.market_cap_rank}` : null,
    prices,
    updatedAt: market.last_updated,
  });
}
