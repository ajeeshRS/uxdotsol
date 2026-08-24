import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoinPrice } from "@/registry/uxdotsol/components/coin-price";
import { NFTCard } from "@/registry/uxdotsol/components/nft-card";
import { NFTCollectionCard } from "@/registry/uxdotsol/components/nft-card-collection";
import {
  ChainBadge,
  SolanaStatusBadge,
} from "@/registry/uxdotsol/components/status-badge";

const pricePayload = {
  id: "solana",
  symbol: "SOL",
  name: "Solana",
  image: null,
  tokenAddress: "So11111111111111111111111111111111111111112",
  currentPrice: 150.25,
  changePercent24h: 2.5,
  high24h: 155,
  low24h: 145,
  marketCap: "$80B",
  volume24h: "$3B",
  rank: "#5",
  prices: [
    { timestamp: 1, time: "00:00", price: 145 },
    { timestamp: 2, time: "01:00", price: 150.25 },
  ],
  updatedAt: "2026-08-17T00:00:00.000Z",
};

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("CoinPrice", () => {
  it("renders live provider data and copies the token identifier", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(pricePayload), { status: 200 }),
    );
    render(<CoinPrice />);

    const trigger = await screen.findByRole("button", { expanded: false });
    expect(trigger).toHaveTextContent("$150.25");
    expect(trigger).toHaveTextContent("+2.50%");

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Copy token identifier" }));
    expect(writeText).toHaveBeenCalledWith(pricePayload.tokenAddress);
  });

  it("surfaces provider errors without fabricating a price", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unavailable", { status: 503 }),
    );
    render(<CoinPrice tokenName="unknown" />);

    const trigger = await screen.findByRole("button", { expanded: false });
    expect(trigger).toHaveTextContent("$0.00");
    fireEvent.click(trigger);
    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
  });
});

describe("network status badges", () => {
  it("exposes chain status and forwards activation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ChainBadge
        name="Solana"
        chainId="devnet"
        status="minor"
        latencyMs={42}
        onClick={onClick}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Solana status Degraded, devnet" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText("42ms")).toBeInTheDocument();
  });

  it("loads Solana Statuspage data and refetches on activation", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: { indicator: "none", description: "All Systems Operational" },
          page: { updated_at: "2026-08-17T00:00:00.000Z" },
        }),
        { status: 200 },
      ),
    );
    const onClick = vi.fn();
    render(<SolanaStatusBadge onClick={onClick} />);

    const badge = await screen.findByRole("button", {
      name: /Solana status Operational, All Systems Operational/,
    });
    await user.click(badge);
    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("turns request failure into an explicit retry state", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<SolanaStatusBadge />);

    expect(
      await screen.findByRole("button", {
        name: "Solana status Down, Tap to retry",
      }),
    ).toBeInTheDocument();
  });
});

describe("NFTCard", () => {
  it("handles liking and purchase actions independently", async () => {
    const user = userEvent.setup();
    const onBuy = vi.fn();
    render(
      <NFTCard
        image="/nft.png"
        name="Degen #1"
        collection="Degens"
        price="2.5"
        likes={7}
        onBuy={onBuy}
      />,
    );

    const like = screen.getByRole("button", { name: "Like" });
    await user.click(like);
    expect(screen.getByRole("button", { name: "Unlike" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("8")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buy now" }));
    expect(onBuy).toHaveBeenCalledOnce();
  });
});

describe("NFTCollectionCard", () => {
  it("opens from the keyboard and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
      <NFTCollectionCard
        bannerImage="/banner.png"
        logoImage="/logo.png"
        name="Degens"
        itemCount={10}
        ownerCount={5}
        items={[]}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Open Degens collection details",
    });
    trigger.focus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog");
    const flipPanel = dialog.firstElementChild as HTMLElement;
    fireEvent.transitionEnd(dialog, { propertyName: "transform" });
    fireEvent.transitionEnd(flipPanel, { propertyName: "transform" });

    expect(screen.getByText("Items for sale")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.transitionEnd(flipPanel, { propertyName: "transform" });
    fireEvent.transitionEnd(dialog, { propertyName: "transform" });

    expect(screen.queryByText("Items for sale")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
