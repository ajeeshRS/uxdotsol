import axe from "axe-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressDisplay } from "@/registry/uxdotsol/components/address-display";
import { UxSolButton } from "@/registry/uxdotsol/components/button";
import { FeeEstimate } from "@/registry/uxdotsol/components/fee-estimate";
import { TokenSafetyDisclosure } from "@/registry/uxdotsol/components/token-safety-disclosure";
import { TokenSwapCard } from "@/registry/uxdotsol/components/token-swap";
import { TransactionProgressTimeline } from "@/registry/uxdotsol/components/transaction-progress-timeline";
import { TransactionReceipt } from "@/registry/uxdotsol/components/transaction-receipt";
import { TransactionReview } from "@/registry/uxdotsol/components/transaction-review";
import type { TokenSafetyToken } from "@/registry/uxdotsol/hooks/use-token-safety";

const ADDRESS = "So11111111111111111111111111111111111111112";
const SIGNATURE = "5".repeat(88);

async function expectNoAxeViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.violations).toEqual([]);
}

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      readText: vi.fn().mockResolvedValue(ADDRESS),
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe("UxSolButton", () => {
  it("defaults to a safe non-submit button and forwards native state", () => {
    render(<UxSolButton disabled>Continue</UxSolButton>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeDisabled();
  });
});

describe("AddressDisplay", () => {
  it("copies the complete address from keyboard activation", async () => {
    render(<AddressDisplay address={ADDRESS} />);
    const control = screen.getByRole("button", {
      name: `Copy address ${ADDRESS}`,
    });

    expect(screen.getByText("So11…1112")).toBeInTheDocument();
    fireEvent.keyDown(control, { key: "Enter" });

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ADDRESS),
    );
    expect(control).toHaveAttribute("data-state", "copied");
  });

  it("removes interactive semantics when copying is disabled", () => {
    render(<AddressDisplay address={ADDRESS} copyable={false} truncate={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(ADDRESS).parentElement).not.toHaveAttribute("tabindex");
  });
});

describe("FeeEstimate", () => {
  it("surfaces provider failure and exposes recovery", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(
      <FeeEstimate
        status="error"
        error="RPC unavailable"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("RPC unavailable");
    await user.click(screen.getByRole("button", { name: "Refresh estimate" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("renders authoritative totals and provider metadata", () => {
    render(
      <FeeEstimate
        estimate={{
          total: { value: "0.000005", symbol: "SOL", fiatValue: "$0.001" },
          items: [
            {
              id: "network",
              label: "Network fee",
              amount: { value: "0.000005", symbol: "SOL" },
            },
          ],
          network: "Devnet",
          source: "RPC",
          updatedAt: "2026-08-17T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getAllByText("0.000005 SOL")).toHaveLength(2);
    expect(screen.getByText("Devnet")).toBeInTheDocument();
    expect(screen.getByText("RPC")).toBeInTheDocument();
  });
});

describe("TransactionProgressTimeline", () => {
  it("announces failure and invokes retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <TransactionProgressTimeline
        steps={[
          { id: "signed", title: "Signed", status: "complete" },
          { id: "confirm", title: "Confirm", status: "failed" },
        ]}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("1 of 2 resolved")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Recheck transaction" }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("TransactionReview", () => {
  const intent = {
    kind: "transfer" as const,
    pay: { value: "1", symbol: "SOL" },
    recipient: { label: "Recipient", address: ADDRESS },
    network: { cluster: "devnet" },
    warnings: [
      {
        id: "unverified-recipient",
        severity: "danger" as const,
        title: "Unverified recipient",
        description: "Verify this address independently.",
        requiresAcknowledgement: true,
      },
    ],
  };

  it("blocks confirmation until required risk is acknowledged", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TransactionReview intent={intent} onConfirm={onConfirm} />);

    const confirm = screen.getByRole("button", { name: "Confirm transaction" });
    expect(confirm).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", {
        name: /I reviewed the warnings and understand/i,
      }),
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("has no automated accessibility violations in its danger state", async () => {
    const { container } = render(
      <TransactionReview intent={intent} onConfirm={vi.fn()} />,
    );
    await expectNoAxeViolations(container);
  });
});

describe("TransactionReceipt", () => {
  it("renders failed receipts without presenting success language", () => {
    render(
      <TransactionReceipt
        receipt={{
          signature: SIGNATURE,
          status: "failed",
          network: { cluster: "devnet" },
          amount: { value: "1", symbol: "SOL" },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Transaction failed" })).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
  });
});

describe("TokenSwapCard", () => {
  it("requires a real integration before enabling execution", () => {
    render(<TokenSwapCard />);
    expect(
      screen.getByRole("button", { name: "Swap integration required" }),
    ).toBeDisabled();
  });

  it("surfaces rejected wallet/integration operations", async () => {
    const user = userEvent.setup();
    const onSwap = vi.fn().mockRejectedValue(new Error("Wallet rejected"));
    render(<TokenSwapCard onSwap={onSwap} />);

    await user.type(screen.getByRole("spinbutton", { name: "You pay amount" }), "1");
    await user.click(screen.getByRole("button", { name: "Swap now" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Wallet rejected");
    expect(onSwap).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "SOL" }),
      expect.objectContaining({ symbol: "USDC" }),
      "1",
    );
  });
});

describe("TokenSafetyDisclosure", () => {
  it("renders adapter-derived danger signals", async () => {
    const token: TokenSafetyToken = {
      mint: ADDRESS,
      name: "Unsafe Token",
      symbol: "UNSAFE",
      icon: null,
      decimals: 9,
      isVerified: false,
      organicScore: 1,
      organicScoreLabel: "low",
      audit: { isSus: true },
      tags: [],
      liquidity: null,
      holderCount: null,
      updatedAt: null,
    };
    const adapter = { getToken: vi.fn().mockResolvedValue(token) };
    render(<TokenSafetyDisclosure mint={ADDRESS} adapter={adapter} />);

    expect(await screen.findByText("High-risk token")).toBeInTheDocument();
    expect(screen.getByText("This token is flagged as suspicious.")).toBeInTheDocument();
  });
});
