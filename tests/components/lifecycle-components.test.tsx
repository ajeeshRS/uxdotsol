import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SafeRecipientField } from "@/registry/uxdotsol/components/safe-recipient-field";
import { TransactionLifecycle } from "@/registry/uxdotsol/components/transaction-lifecycle";

const ADDRESS = "So11111111111111111111111111111111111111112";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      readText: vi.fn().mockResolvedValue(ADDRESS),
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe("SafeRecipientField", () => {
  it("marks malformed addresses invalid and supports clearing", async () => {
    const user = userEvent.setup();
    render(<SafeRecipientField defaultValue="invalid-address" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid Solana address.",
    );
    expect(screen.getByLabelText("Recipient")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Clear recipient" }));
    expect(screen.getByLabelText("Recipient")).toHaveValue("");
  });

  it("pastes and normalizes clipboard input", async () => {
    const onValueChange = vi.fn();
    render(<SafeRecipientField onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(ADDRESS));
    await waitFor(() =>
      expect(screen.getByLabelText("Recipient")).toHaveValue(ADDRESS),
    );
  });

  it("reports clipboard denial without losing the field", async () => {
    vi.mocked(navigator.clipboard.readText).mockRejectedValue(
      new Error("denied"),
    );
    render(<SafeRecipientField />);

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Clipboard access was not available.",
    );
  });
});

describe("TransactionLifecycle", () => {
  it("keeps wallet rejection distinct from an on-chain failure", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <TransactionLifecycle
        submissionState="failed"
        submissionError="User rejected the request"
        onRetry={onRetry}
      />,
    );

    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.getByText("User rejected the request")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders a missing RPC client as an explicit terminal error", async () => {
    render(
      <TransactionLifecycle
        signature="test-signature"
        client={null}
        subscribe={false}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("Failed").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("Missing Solana client.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View transaction in explorer" }),
    ).toHaveAttribute("href", expect.stringContaining("test-signature"));
  });

  it("reports confirmed commitment and emits the terminal state", async () => {
    const onStatusChange = vi.fn();
    const client = {
      getSignatureStatuses: vi.fn().mockResolvedValue({
        value: [
          {
            err: null,
            confirmations: 1,
            confirmationStatus: "confirmed",
          },
        ],
      }),
    };
    render(
      <TransactionLifecycle
        signature="test-signature"
        client={client}
        subscribe={false}
        onStatusChange={onStatusChange}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("Confirmed").length).toBeGreaterThan(0),
    );
    expect(onStatusChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "confirmed",
        isPending: false,
        isTerminal: true,
      }),
    );
  });
});
