"use client";

import React, { type ReactNode } from "react";

import { AddressDisplay } from "@/registry/uxdotsol/components/address-display";
import { QuickSendFlow } from "@/registry/uxdotsol/flows/quick-send-flow";

import { ConnectWalletBtn } from "@/registry/uxdotsol/components/connect-wallet-btn";
import { UxSolButton } from "@/registry/uxdotsol/components/button";
import { SolanaProvider } from "@/components/solana-provider";
import { NFTCard } from "@/registry/uxdotsol/components/nft-card";
import { NFTCollectionCard } from "@/registry/uxdotsol/components/nft-card-collection";
import CoinPrice from "@/registry/uxdotsol/components/coin-price";
import TokenSwapCard from "@/registry/uxdotsol/components/token-swap";
import { SolanaStatusBadge } from "@/registry/uxdotsol/components/status-badge";
import Image from "next/image";

function UseTokenBalancePreview() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-[#f4f4f4] bg-white px-6 py-4 text-sm text-neutral-600 dark:border-[#141414] dark:bg-neutral-950 dark:text-neutral-300">
      <span>Live Balance</span>
      <span className="font-mono text-2xl font-semibold text-neutral-950 dark:text-white">
        1.25 USDC
      </span>
    </div>
  );
}

const previewMap: Record<string, ReactNode> = {
  "address-display": (
    <div className="flex items-center justify-center p-8">
      <AddressDisplay
        address="UxSol1111111111111111111111111111111111111"
        truncate={true}
      />
    </div>
  ),
  "coin-price": (
    <div className="flex items-center justify-center p-8">
      <CoinPrice />
    </div>
  ),
  "use-token-balance": <UseTokenBalancePreview />,
  "quick-send-flow": (
    <div className="flex w-full max-w-240 items-center justify-center p-0">
      <QuickSendFlow />
    </div>
  ),
  "private-transfer": (
    <div className="flex items-center justify-center p-4 w-full">
      <Image
        src={"/previews/private-pay2.png"}
        alt="private-pay-preview"
        height={400}
        width={400}
        className="w-full h-auto rounded-xl"
      />
    </div>
  ),
  "connect-wallet-btn": (
    <div className="flex items-center justify-center p-4">
      <SolanaProvider>
        <ConnectWalletBtn />
      </SolanaProvider>
    </div>
  ),
  button: (
    <div className="flex flex-wrap items-center justify-center gap-2 p-8">
      <UxSolButton>Primary</UxSolButton>
      <UxSolButton variant="secondary">Secondary</UxSolButton>
      <UxSolButton variant="outline">Outline</UxSolButton>
      <UxSolButton variant="ghost">Ghost</UxSolButton>
      <UxSolButton variant="destructive">Disconnect</UxSolButton>
      <UxSolButton variant="success">Success</UxSolButton>
    </div>
  ),
  "nft-card": (
    <div className="flex items-center justify-center p-4">
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
        tilt={true}
        tiltIntensity={28}
        onBuy={() => {}}
        className=""
      />
    </div>
  ),
  "nft-card-collection": (
    <div className="flex items-center justify-center p-4">
      <NFTCollectionCard
        bannerImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        logoImage="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        name="Madlads"
        verified={true}
        description="A collection of digital assets with shared artwork, metadata, and marketplace activity."
        itemCount={10000}
        ownerCount={5000}
        floorPrice="0.5"
        priceSymbol="SOL"
        volume24h="1.2k"
        floorChange={12.5}
        href="https://www.madlads.com"
        tilt={true}
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
    </div>
  ),
  "token-swap": (
    <div className="flex items-center justify-center p-4">
      <TokenSwapCard />
    </div>
  ),
  "status-badge": (
    <div className="flex items-center justify-center p-4">
      <SolanaStatusBadge />
    </div>
  ),
};

export function ComponentPreview({ slug }: { slug: string }) {
  const isFlowPreview = slug === "quick-send-flow";
  const isTemplatePreview = slug === "private-transfer";
  const isLargePreview = isFlowPreview || isTemplatePreview;

  return previewMap[slug] ? (
    <div
      className={`relative flex items-center justify-center overflow-visible rounded-[30px] border border-[#f4f4f4] bg-white dark:border-[#141414] dark:bg-neutral-950 ${
        isLargePreview ? "min-h-175 p-3 sm:p-5" : "min-h-90 p-5 sm:p-6"
      }`}
    >
      <div
        className={`relative flex w-full items-center justify-center overflow-visible rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] dark:bg-black ${
          isLargePreview ? "min-h-160 p-2 sm:p-4" : "min-h-75 p-4"
        }`}
      >
        {previewMap[slug]}
      </div>
    </div>
  ) : (
    <div className="flex w-full items-center justify-center rounded-[30px] border border-dashed border-[#eaeaea] p-10 text-neutral-400 dark:border-[#1c1c1c] dark:text-neutral-600">
      Preview not available
    </div>
  );
}
