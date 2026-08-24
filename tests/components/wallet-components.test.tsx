import { PublicKey } from "@solana/web3.js";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: {} as Record<string, unknown>,
  wallet: {} as Record<string, unknown>,
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({ connection: mocks.connection }),
  useWallet: () => mocks.wallet,
}));

import { ConnectWalletBtn } from "@/registry/uxdotsol/components/connect-wallet-btn";
import { SignInWithSolana } from "@/registry/uxdotsol/components/sign-in-with-solana";
import { SolanaPayCheckout } from "@/registry/uxdotsol/components/solana-pay-checkout";

const ADDRESS = "So11111111111111111111111111111111111111112";
const publicKey = new PublicKey(ADDRESS);

function disconnectedWallet() {
  return {
    wallet: null,
    wallets: [],
    connected: false,
    publicKey: null,
    connecting: false,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(),
    sendTransaction: vi.fn(),
    signIn: undefined,
    signMessage: undefined,
  };
}

beforeEach(() => {
  mocks.connection = {};
  mocks.wallet = disconnectedWallet();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("ConnectWalletBtn", () => {
  it("opens an accessible empty-wallet dialog and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<ConnectWalletBtn showMenuToggle={false} />);

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(screen.getByRole("dialog", { name: "Connect Wallet" })).toBeInTheDocument();
    expect(screen.getByText("No wallets found")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("loads connected account data, copies the address, and disconnects", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const disconnect = vi.fn().mockResolvedValue(undefined);
    mocks.wallet = {
      ...disconnectedWallet(),
      connected: true,
      publicKey,
      disconnect,
      wallet: {
        adapter: {
          name: "Phantom",
          icon: "/phantom.png",
          connected: true,
          publicKey,
          on: vi.fn(),
          off: vi.fn(),
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ accountExists: true, balance: "2.50000" }),
        { status: 200 },
      ),
    );
    const { container } = render(<ConnectWalletBtn showMenuToggle={false} />);

    await user.click(screen.getByRole("button", { name: /So11/ }));
    const accountMenu = screen.getByRole("menu");
    expect(document.body).toContainElement(accountMenu);
    expect(container).not.toContainElement(accountMenu);
    expect(await screen.findByText("2.50000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy address" }));
    expect(writeText).toHaveBeenCalledWith(ADDRESS);

    await user.click(screen.getByRole("menuitem", { name: /Disconnect/ }));
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("updates immediately when the adapter connects or changes accounts", () => {
    const listeners = new Map<string, Set<() => void>>();
    const adapter = {
      name: "Phantom",
      icon: "/phantom.png",
      connected: false,
      publicKey: null as PublicKey | null,
      on(event: string, listener: () => void) {
        const eventListeners = listeners.get(event) ?? new Set();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      },
      off(event: string, listener: () => void) {
        listeners.get(event)?.delete(listener);
      },
    };
    const emit = (event: string) => {
      listeners.get(event)?.forEach((listener) => listener());
    };
    mocks.wallet = {
      ...disconnectedWallet(),
      wallet: { adapter },
    };

    render(<ConnectWalletBtn showMenuToggle={false} />);
    expect(
      screen.getByRole("button", { name: "Connect wallet" }),
    ).toBeInTheDocument();

    act(() => {
      adapter.connected = true;
      adapter.publicKey = publicKey;
      emit("connect");
    });
    expect(screen.getByRole("button", { name: /So11/ })).toBeInTheDocument();

    act(() => {
      adapter.publicKey = new PublicKey("11111111111111111111111111111111");
      emit("connect");
    });
    expect(screen.getByRole("button", { name: /1111/ })).toBeInTheDocument();

    act(() => {
      adapter.connected = false;
      adapter.publicKey = null;
      emit("disconnect");
    });
    expect(
      screen.getByRole("button", { name: "Connect wallet" }),
    ).toBeInTheDocument();
  });

  it("forwards the controlled mobile menu toggle", async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    render(<ConnectWalletBtn onMenuToggle={onMenuToggle} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onMenuToggle).toHaveBeenCalledWith(true);
  });
});

describe("SignInWithSolana", () => {
  it("completes a wallet-standard sign-in challenge", async () => {
    const user = userEvent.setup();
    const session = {
      address: ADDRESS,
      expiresAt: "2026-08-18T00:00:00.000Z",
    };
    const signIn = vi.fn().mockResolvedValue({
      account: {
        address: ADDRESS,
        publicKey: publicKey.toBytes(),
        chains: ["solana:mainnet"],
        features: ["solana:signIn"],
      },
      signedMessage: new Uint8Array([1, 2]),
      signature: new Uint8Array([3, 4]),
      signatureType: "ed25519",
    });
    mocks.wallet = {
      ...disconnectedWallet(),
      publicKey,
      signIn,
      wallet: {
        adapter: {
          name: "Phantom",
          icon: "/phantom.png",
          connected: true,
          publicKey,
        },
      },
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input, init) => {
        const url = String(input);
        if (url.includes("?session=1")) {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
          });
        }
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({ authenticated: true, session }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            input: {
              domain: "localhost",
              statement: "Sign in",
              uri: "http://localhost",
              version: "1",
              chainId: "mainnet",
              nonce: "nonce",
              issuedAt: "2026-08-17T00:00:00.000Z",
            },
          }),
          { status: 200 },
        );
      },
    );
    const onSuccess = vi.fn();
    render(
      <SignInWithSolana balance="2 SOL" onSuccess={onSuccess} />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Continue with Solana" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Signed in with Solana" }),
    ).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(session);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/solana",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces challenge creation errors", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    mocks.wallet = {
      ...disconnectedWallet(),
      wallet: { adapter: { name: "Phantom", connected: false } },
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("?session=1")) {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ error: "Challenge unavailable" }), {
        status: 503,
      });
    });
    render(<SignInWithSolana onError={onError} />);

    await user.click(
      await screen.findByRole("button", { name: "Continue with Solana" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Challenge unavailable",
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Challenge unavailable" }),
    );
  });
});

describe("SolanaPayCheckout", () => {
  it("rejects invalid payment requests and disables copying", () => {
    render(<SolanaPayCheckout recipient={ADDRESS} amount={0} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a payment amount greater than zero.",
    );
    expect(
      screen.getByRole("button", { name: "Copy payment link" }),
    ).toBeDisabled();
  });

  it("renders a real payment request and disconnected-wallet action", () => {
    render(
      <SolanaPayCheckout
        recipient={ADDRESS}
        amount={1.25}
        network="devnet"
        orderId="ORDER-1"
      />,
    );

    expect(screen.getByText("1.25")).toBeInTheDocument();
    expect(screen.getByText("Order ORDER-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy payment link" }),
    ).toBeEnabled();
  });

  it("locks payment execution after confirmation", () => {
    render(
      <SolanaPayCheckout
        recipient={ADDRESS}
        amount={1}
        status="confirmed"
      />,
    );

    expect(screen.getByRole("button", { name: "Payment complete" })).toBeDisabled();
    expect(screen.getByText("Payment confirmed")).toBeInTheDocument();
  });
});
