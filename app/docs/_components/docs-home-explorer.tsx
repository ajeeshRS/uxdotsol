"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { docComponents } from "@/lib/docs";
import { AddressDisplay } from "@/registry/uxdotsol/components/address-display";
import { CoinPrice } from "@/registry/uxdotsol/components/coin-price";
import { ConnectWalletBtn } from "@/registry/uxdotsol/components/connect-wallet-btn";
import { FeeEstimate } from "@/registry/uxdotsol/components/fee-estimate";
import { SolanaPayCheckout } from "@/registry/uxdotsol/components/solana-pay-checkout";
import { SafeRecipientField } from "@/registry/uxdotsol/components/safe-recipient-field";
import { TokenSafetyDisclosure } from "@/registry/uxdotsol/components/token-safety-disclosure";
import { TransactionLifecycle } from "@/registry/uxdotsol/components/transaction-lifecycle";
import { TransactionReceipt } from "@/registry/uxdotsol/components/transaction-receipt";
import { TransactionProgressTimeline } from "@/registry/uxdotsol/components/transaction-progress-timeline";
import { TransactionReview } from "@/registry/uxdotsol/components/transaction-review";
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
  "use-token-safety": "API hooks",
  "use-token-list": "API hooks",
  "use-token-metadata": "API hooks",
  "use-priority-fee-estimate": "API hooks",
  "use-payment-quote": "API hooks",
  "use-payment-status": "API hooks",
  "use-transaction-history": "API hooks",
  "use-recipient-validation": "Hooks",
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

const cardDescriptions: Record<string, string> = {
  "address-display": "Shorten and copy blockchain addresses.",
  "connect-wallet-btn": "Connect a Solana wallet and show its status.",
  "sign-in-with-solana": "Sign in securely with a Solana wallet.",
  "solana-pay-checkout": "Accept Solana Pay transfers by link or QR code.",
  "transaction-review": "Review transaction details, fees, and warnings.",
  "safe-recipient-field": "Validate a Solana recipient before sending.",
  "token-safety-disclosure": "Show clear token risk and verification signals.",
  "transaction-lifecycle": "Show each transaction state through confirmation.",
  "transaction-receipt": "Display transaction details and explorer links.",
  "transaction-progress-timeline": "Track transaction progress, failures, and retries.",
  "fee-estimate": "Show an itemized transaction fee estimate.",
  button: "Reusable buttons with accessible styles and states.",
  "nft-card": "Present NFT artwork, pricing, and actions.",
  "nft-card-collection": "Present collection artwork, stats, and items.",
  "coin-price": "Show token prices and trend details.",
  "token-swap": "Swap tokens with slippage and confirmation controls.",
  "status-badge": "Show network or service availability.",
  "use-token-balance": "Fetch and refresh wallet token balances.",
  "use-token-safety": "Load normalized token safety states.",
  "use-recipient-validation": "Check recipient safety through Solana RPC.",
  "use-transaction-simulation": "Simulate transactions before wallet approval.",
  "use-smart-retry": "Retry Solana operations with configurable backoff.",
  "use-transaction-status": "Track a transaction through confirmation.",
  "use-private-payment": "Build private payment flows with MagicBlock.",
  "use-token-list": "Search normalized token metadata through an API adapter.",
  "use-token-metadata": "Load normalized metadata for one token mint.",
  "use-priority-fee-estimate": "Read recent priority-fee ranges from Solana RPC.",
  "use-payment-quote": "Request a normalized token conversion quote.",
  "use-payment-status": "Verify a payment signature through server-side RPC.",
  "use-transaction-history": "Load recent signatures for a Solana account.",
  "use-optimistic-transaction": "Manage optimistic transaction updates and rollbacks.",
  "quick-send-flow": "Send SOL with validation, review, and receipt states.",
  "token-discovery-safety-flow": "Search tokens and review live safety signals.",
  "payment-checkout-flow": "Review payment routing before Solana Pay checkout.",
  "transaction-recovery-flow": "Recheck an existing signature before resending.",
  "mobile-wallet-payment-flow": "Guide desktop QR and same-device wallet handoff.",
  "private-transfer": "Start a private devnet USDC payment flow.",
  "spl-token-transfer": "Send an SPL token with recipient and mint checks.",
  "merchant-checkout": "Launch a complete merchant Solana Pay checkout.",
  "payment-tracking-receipt": "Track a payment and show its verified receipt.",
  "mobile-wallet-payment": "Launch a mobile-friendly payment page.",
};

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
  if (hookGroups[item.name] === "API hooks") return "API hook";
  if (path.includes("hooks")) return "Hook";
  if (path.includes("flows")) return "Flow";
  if (path.includes("templates")) return "Template";
  return "Component";
}

function SolanaPreviewMark({
  className = "",
}: {
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://solana.com/src/img/branding/solanaLogoMark.svg"
      alt=""
      width={32}
      height={32}
      className={`brightness-0 invert dark:invert-0 ${className}`}
    />
  );
}

function SignInWithSolanaCardPreview() {
  return (
    <div className="w-98 rounded-[22px] border border-zinc-200 bg-white px-8 py-10 text-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#111113] dark:text-zinc-50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
        <SolanaPreviewMark className="size-8" />
      </div>

      <p className="mt-7 text-center text-[32px] font-bold leading-10 tracking-[-0.04em] text-zinc-950 dark:text-zinc-50">
        Sign in with Solana
      </p>
      <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Connect your wallet to continue securely.
      </p>

      <div className="mt-8 flex min-h-15 w-full items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-5 text-base font-semibold text-white opacity-70 shadow-[0_10px_24px_rgba(0,0,0,0.16)] dark:bg-zinc-100 dark:text-zinc-950">
        <SolanaPreviewMark className="size-5" />
        Connect Wallet First
      </div>
    </div>
  );
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
          <ConnectWalletBtn className="shrink-0" showMenuToggle={false} />
        </SolanaProvider>
      );
    case "sign-in-with-solana":
      return <SignInWithSolanaCardPreview />;
    case "solana-pay-checkout":
      return (
        <SolanaProvider>
          <SolanaPayCheckout
            recipient="FvJ8k8HhXp4a3zQyFMZd4FvEqcYdYE7gSZWxrEBRfBsB"
            amount={0.025}
            merchantName="UX.SOL Store"
            description="Order checkout"
            orderId="#2048"
          />
        </SolanaProvider>
      );
    case "transaction-review":
      return (
        <TransactionReview
          intent={{
            kind: "transfer",
            pay: { value: "1.25", symbol: "SOL", fiatValue: "≈ $182.40" },
            recipient: {
              label: "ux.sol",
              address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg88R",
              verified: true,
            },
            network: { cluster: "devnet" },
            fees: [{ label: "Network fee", value: "0.000005 SOL" }],
            walletDebit: { value: "1.250005", symbol: "SOL" },
          }}
        />
      );
    case "safe-recipient-field":
      return <SafeRecipientField showDetails={false} />;
    case "token-safety-disclosure":
      return (
        <TokenSafetyDisclosure
          mint={null}
          compact
          showExplorerLink={false}
        />
      );
    case "transaction-lifecycle":
      return <TransactionLifecycle showReset={false} />;
    case "transaction-receipt":
      return <TransactionReceipt />;
    case "transaction-progress-timeline":
      return <TransactionProgressTimeline />;
    case "fee-estimate":
      return <FeeEstimate />;
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
        frame: "h-60",
        inner: "scale-[0.40]",
      };
    case "nft-card-collection":
      return {
        frame: "h-60",
        inner: "scale-[0.42]",
      };
    case "token-swap":
      return {
        frame: "h-60",
        inner: "scale-[0.40]",
      };
    case "coin-price":
      return {
        frame: "h-60",
        inner: "scale-100",
      };
    case "status-badge":
      return {
        frame: "h-60",
        inner: "scale-[0.78]",
      };
    case "sign-in-with-solana":
      return {
        frame: "h-60",
        inner: "scale-[0.38]",
      };
    case "solana-pay-checkout":
      return {
        frame: "h-60",
        inner: "scale-[0.25]",
      };
    case "transaction-review":
      return {
        frame: "h-60",
        inner: "scale-[0.30]",
      };
    case "safe-recipient-field":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.82]",
      };
    case "token-safety-disclosure":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.75]",
      };
    case "transaction-lifecycle":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.32]",
      };
    case "transaction-receipt":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.75]",
      };
    case "transaction-progress-timeline":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.75]",
      };
    case "fee-estimate":
      return {
        frame: "h-60",
        inner: "w-full scale-[0.50]",
      };
    default:
      return {
        frame: "h-60",
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-black/5 hover:text-foreground active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 motion-reduce:transform-none dark:hover:bg-white/10 dark:focus-visible:ring-white/15"
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

              <div className="grid gap-4 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-3">
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
                      className="group relative flex cursor-pointer overflow-hidden rounded-[30px] border border-[#f4f4f4] bg-white p-5 transition-[translate,border-color] duration-200 ease-[var(--ease-in-out)] hover:-translate-y-1 hover:border-[#eaeaea] motion-reduce:transform-none dark:border-[#141414] dark:bg-neutral-950 dark:hover:border-[#1c1c1c] sm:p-6"
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
                            className={`pointer-events-none flex ${previewLayout.frame} w-full select-none items-center justify-center overflow-hidden rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] p-4 dark:bg-black`}
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
                            className="pointer-events-none flex h-60 w-full select-none items-center justify-center overflow-hidden rounded-[22px] bg-[url('/item-bg-light.png')] bg-cover bg-center p-4 dark:bg-[url('/item-bg.png')]"
                          >
                            <span className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md">
                              {itemTypeLabel}
                            </span>
                          </div>
                        )}

                        <div className="mt-5">
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {itemTypeLabel}
                          </p>
                          <h3
                            className="text-[24px] font-semibold leading-[1.1] tracking-normal"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <span className="line-clamp-2 text-balance">
                              {item.title ?? item.name}
                            </span>
                          </h3>
                          {item.description ? (
                            <p
                              className="mt-2 line-clamp-2 text-sm leading-5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {cardDescriptions[item.name] ?? item.description}
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
