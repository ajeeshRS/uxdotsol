"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { docComponents } from "@/lib/docs";
import { AddressDisplay } from "@/registry/uxdotsol/components/address-display";
import { CoinPrice } from "@/registry/uxdotsol/components/coin-price";
import { ConnectWalletBtn } from "@/registry/uxdotsol/components/connect-wallet-btn";
import { UxSolButton } from "@/registry/uxdotsol/components/button";
import { NFTCard } from "@/registry/uxdotsol/components/nft-card";
import { NFTCollectionCard } from "@/registry/uxdotsol/components/nft-card-collection";
import { SolanaStatusBadge } from "@/registry/uxdotsol/components/status-badge";
import TokenSwapCard from "@/registry/uxdotsol/components/token-swap";
import { SolanaProvider } from "@/components/solana-provider";

const hookGroups: Record<string, string> = {
  "use-smart-retry": "Hooks",
  "use-optimistic-transaction": "Hooks",
  "use-token-balance": "Hooks",
  "use-transaction-simulation": "Hooks",
  "use-transaction-status": "Hooks",
  "use-private-payment": "API hooks",
};

const sections = [
  "Components",
  "Hooks",
  "API hooks",
  "Flows",
  "Templates",
];

function getCategory(item: (typeof docComponents)[number]) {
  const path = item.files?.[0]?.path || "";
  if (item.type === "registry:hook") return hookGroups[item.name] || "Hooks";
  if (path.includes("flows")) return "Flows";
  if (path.includes("templates")) return "Templates";
  return "Components";
}

function getHref(item: (typeof docComponents)[number]) {
  const path = item.files?.[0]?.path || "";
  if (path.includes("hooks")) return `/docs/hooks/${item.name}`;
  if (path.includes("flows")) return `/docs/flows/${item.name}`;
  if (path.includes("templates")) return `/docs/templates/${item.name}`;
  return `/docs/components/${item.name}`;
}

function getItemTypeLabel(item: (typeof docComponents)[number]) {
  const path = item.files?.[0]?.path || "";
  if (item.name === "use-private-payment") return "API hook";
  if (path.includes("hooks")) return "Hook";
  if (path.includes("flows")) return "Flow";
  if (path.includes("templates")) return "Template";
  return "Component";
}

function getComponentPreview(name: string) {
  switch (name) {
    case "address-display":
      return (
        <AddressDisplay
          address="GJ7xW7qf2CpFZ6jNW9Xx4CXiN4wWb7DKP"
          truncate={true}
        />
      );
    case "connect-wallet-btn":
      return (
        <SolanaProvider>
          <ConnectWalletBtn />
        </SolanaProvider>
      );
    case "button":
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <UxSolButton size="sm">Primary</UxSolButton>
          <UxSolButton size="sm" variant="secondary">
            Secondary
          </UxSolButton>
          <UxSolButton size="sm" variant="outline">
            Outline
          </UxSolButton>
        </div>
      );
    case "nft-card":
      return (
        <NFTCard
          image="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
          name="Madlads"
          collection="Madlads"
          verified={true}
          price="0.5"
          priceSymbol="SOL"
          lastSale="1.2"
          ownerAvatar="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
          ownerName="Madlads"
          likes={100}
          href="https://www.madlads.com"
          tilt={false}
          tiltIntensity={28}
          onBuy={() => {}}
          className=""
        />
      );
    case "nft-card-collection":
      return (
        <NFTCollectionCard
          bannerImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
          logoImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
          name="Madlads"
          verified={true}
          description="A collection of digital assets with shared artwork and marketplace activity."
          itemCount={10000}
          ownerCount={5000}
          floorPrice="0.5"
          priceSymbol="SOL"
          volume24h="1.2k"
          floorChange={12.5}
          href="https://www.madlads.com"
          tilt={false}
          items={Array(6)
            .fill({
              image:
                "https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75",
              name: "Madlad",
              collection: "Madlads",
              verified: true,
              price: "0.5",
              priceSymbol: "SOL",
              likes: 100,
            })
            .map((item, i) => ({ ...item, id: i }))}
        />
      );
    case "coin-price":
      return <CoinPrice />;
    case "token-swap":
      return <TokenSwapCard />;
    case "status-badge":
      return <SolanaStatusBadge size="sm" />;
    default:
      return null;
  }
}

function getPreviewLayout(name: string) {
  switch (name) {
    case "nft-card":
      return {
        frame: "h-55",
        inner: "scale-[0.44]",
      };
    case "nft-card-collection":
      return {
        frame: "h-55",
        inner: "scale-[0.48]",
      };
    case "token-swap":
      return {
        frame: "h-55",
        inner: "scale-[0.44]",
      };
    case "coin-price":
      return {
        frame: "h-55",
        inner: "scale-100",
      };
    case "status-badge":
      return {
        frame: "h-55",
        inner: "scale-[0.78]",
      };
    default:
      return {
        frame: "h-55",
        inner: "scale-100",
      };
  }
}

export function DocsHomeExplorer() {
  const [query, setQuery] = useState("");

  const groupedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const items = docComponents.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title?.toLowerCase().includes(normalizedQuery) ||
        item.name?.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery);

      return matchesQuery;
    });

    return sections.flatMap((section) => {
      const sectionItems = items.filter(
        (item) => getCategory(item) === section,
      );

      return sectionItems.length > 0
        ? [{ section, items: sectionItems }]
        : [];
    });
  }, [query]);
  const resultCount = groupedItems.reduce(
    (total, group) => total + group.items.length,
    0,
  );

  return (
    <section className="space-y-8" aria-label="Registry explorer">
      <div className="sticky top-18 z-20 -mx-4 bg-(--bg-primary) px-4 py-4 sm:-mx-8 sm:px-8 md:static md:mx-0 md:bg-transparent md:p-5">
        <label htmlFor="docs-registry-search" className="sr-only">
          Search registry
        </label>
        <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#f3f3f3] px-3 transition-[border-color,box-shadow] focus-within:border-(--border-strong) focus-within:ring-2 focus-within:ring-ring/20 dark:border-[#171717]">
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <input
            id="docs-registry-search"
            name="registry-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search registry items…"
            aria-describedby="registry-result-count"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck="false"
            style={{ color: "var(--text-primary)" }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:hover:bg-white/10 dark:focus-visible:ring-white/15"
              aria-label="Clear registry search"
              title="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p
          id="registry-result-count"
          role="status"
          aria-live="polite"
          className="mt-3 px-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {resultCount} {resultCount === 1 ? "item" : "items"}
          {query.trim() ? ` matching “${query.trim()}”` : " available"}
        </p>
      </div>

      {groupedItems.length > 0 ? (
        <div className="space-y-12">
          {groupedItems.map((group) => (
            <section key={group.section} className="space-y-4">
              <h2
                className="text-xl font-semibold tracking-normal sm:text-2xl"
                style={{ color: "var(--text-primary)" }}
              >
                {group.section}
                <span
                  className="ml-2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {group.items.length}
                </span>
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const href = getHref(item);
                  const isComponent = group.section === "Components";
                  const componentPreview = isComponent
                    ? getComponentPreview(item.name)
                    : null;
                  const itemTypeLabel = getItemTypeLabel(item);
                  const previewLayout = getPreviewLayout(item.name);

                  return (
                    <div
                      key={item.name}
                      className={`group relative flex cursor-pointer overflow-hidden rounded-[30px] border border-[#f4f4f4] bg-white p-5 transition-[border-color,transform] duration-300 ease-in-out hover:-translate-y-1 hover:border-[#eaeaea] dark:border-[#141414] dark:bg-neutral-950 dark:hover:border-[#1c1c1c] sm:p-6 ${
                        isComponent ? "min-h-100" : "min-h-90"
                      }`}
                    >
                      <Link
                        href={href}
                        aria-label={`View ${item.title ?? item.name} documentation`}
                        className="absolute inset-0 z-10 rounded-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <div className="relative flex min-w-0 flex-1 flex-col">
                        {componentPreview ? (
                          <div
                            inert
                            aria-hidden="true"
                            className={`pointer-events-none flex ${previewLayout.frame} w-full select-none items-center justify-center overflow-hidden rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] px-4 dark:bg-black`}
                          >
                            <div
                              className={`flex max-w-full origin-center items-center justify-center ${previewLayout.inner}`}
                            >
                              {componentPreview}
                            </div>
                          </div>
                        ) : (
                          <div
                            inert
                            aria-hidden="true"
                            className="pointer-events-none flex h-55 w-full select-none items-center justify-center overflow-hidden rounded-[22px] bg-[url('/item-bg-light.png')] bg-cover bg-center px-4 dark:bg-[url('/item-bg.png')]"
                          >
                            <span className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md">
                              {itemTypeLabel}
                            </span>
                          </div>
                        )}

                        <div className="mt-7">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {itemTypeLabel}
                          </p>
                          <h3
                            className="text-balance text-[24px] font-semibold leading-[1.05] tracking-normal"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.title ?? item.name}
                          </h3>
                          {item.description ? (
                            <p
                              className="mt-3 line-clamp-2 text-sm leading-6"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="p-10 text-center text-sm text-neutral-400 dark:text-neutral-600"
        >
          No registry items match “{query.trim()}”.
        </div>
      )}
    </section>
  );
}
