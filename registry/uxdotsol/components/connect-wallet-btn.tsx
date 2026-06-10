"use client";

/**
 * @file ConnectWalletBtn — a full-featured Solana wallet connect button for
 * nav bars. Handles the connected / disconnected state, a dropdown account
 * panel, a wallet selection modal, and a mobile hamburger toggle.
 *
 * Requires {@link SolanaProvider} (or any `@solana/wallet-adapter-react`
 * context) to be mounted higher in the tree.
 *
 * @module uxdotsol/components/connect-wallet-btn
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ChevronDown,
  Check,
  Copy,
  Wallet,
  X,
  Menu,
  LogOut,
  RefreshCw,
} from "lucide-react";

const MOBILE_USER_AGENT_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

type ClusterValue = "mainnet-beta" | "devnet" | "testnet";

type WalletAccountState = {
  accountExists: boolean | null;
  balance: string;
};

const CLUSTERS: { label: string; value: ClusterValue }[] = [
  { label: "Mainnet", value: "mainnet-beta" },
  { label: "Devnet", value: "devnet" },
  { label: "Testnet", value: "testnet" },
];

function getExplorerUrl(address: string, cluster: ClusterValue) {
  const suffix = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/address/${address}${suffix}`;
}

function getWalletBrowseUrl(walletName: string, href: string, origin: string) {
  const name = walletName.toLowerCase();
  const encodedHref = encodeURIComponent(href);
  const encodedOrigin = encodeURIComponent(origin);

  if (name.includes("phantom")) {
    return `https://phantom.app/ul/browse/${encodedHref}?ref=${encodedOrigin}`;
  }

  if (name.includes("solflare")) {
    return `https://solflare.com/ul/v1/browse/${encodedHref}?ref=${encodedOrigin}`;
  }

  return null;
}

function hasMobileProvider(walletName: string) {
  const name = walletName.toLowerCase();
  const browserWindow = window as Window & {
    phantom?: { solana?: { isPhantom?: boolean } };
    solana?: { isPhantom?: boolean };
    solflare?: { isSolflare?: boolean };
  };

  if (name.includes("phantom")) {
    return Boolean(
      browserWindow.phantom?.solana?.isPhantom ||
        browserWindow.solana?.isPhantom,
    );
  }

  if (name.includes("solflare")) {
    return Boolean(browserWindow.solflare?.isSolflare);
  }

  return false;
}

function getIsMobileBrowser() {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  return coarsePointer || MOBILE_USER_AGENT_RE.test(navigator.userAgent);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the {@link ConnectWalletBtn} component.
 */
export interface ConnectWalletBtnProps {
  /**
   * The current open/closed state of the mobile navigation menu.
   * Used to toggle the hamburger ↔ close icon on small screens.
   */
  menuOpen?: boolean;
  /**
   * Called when the mobile menu toggle button is pressed.
   * Receives the **new** boolean state so the parent can control it.
   */
  onMenuToggle?: (open: boolean) => void;
  /** Optional Tailwind / CSS class applied to the outermost flex wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Navigation-bar wallet connect button for Solana dApps.
 *
 * - **Disconnected** — shows a "Connect Wallet" button that opens a modal
 *   listing all detected and available wallet adapters.
 * - **Connected** — shows a pill with the connected wallet icon, a
 *   truncated address, and a dropdown panel with copy-address, change-wallet,
 *   and disconnect actions.
 * - **Mobile** — shows a hamburger / close toggle for the nav drawer.
 *
 * @param props - {@link ConnectWalletBtnProps}
 *
 * @example
 * // Inside a <nav> with SolanaProvider wrapping the app
 * <ConnectWalletBtn
 *   menuOpen={navOpen}
 *   onMenuToggle={setNavOpen}
 *   className="ml-auto"
 * />
 */
export function ConnectWalletBtn({
  menuOpen = false,
  onMenuToggle,
  className = "",
}: ConnectWalletBtnProps) {
  const { wallet, wallets, connected, publicKey, disconnect, select, connect } =
    useWallet();

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------

  /** Controls visibility of the connected-account dropdown. */
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  /** Controls visibility of the wallet selection modal. */
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  /** Whether the copy-address confirmation is currently active. */
  const [isCopied, setIsCopied] = useState(false);
  /** `true` while a wallet connection attempt is in flight. */
  const [connecting, setConnecting] = useState(false);
  /** Name of the wallet adapter currently being connected to. */
  const [connectingName, setConnectingName] = useState<string | null>(null);
  /** Selection waiting for WalletProvider context to commit before connect. */
  const [pendingWalletName, setPendingWalletName] =
    useState<WalletName<string> | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  /** Whether the current client is likely a phone/tablet browser. */
  const [isMobile] = useState(getIsMobileBrowser);
  /** Selected Solana cluster for account data lookups. */
  const [cluster, setCluster] = useState<ClusterValue>("mainnet-beta");
  /** RPC-backed account data for the selected cluster. */
  const [accountState, setAccountState] = useState<WalletAccountState | null>(
    null,
  );
  /** Loading and error state for account data. */
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  /** Used by the outside-click handler to detect clicks outside the dropdown. */
  const dropdownRef = useRef<HTMLDivElement>(null);
  /** Pending timeout ID for the copy confirmation reset — cancelled on unmount. */
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountCacheRef = useRef(new Map<string, WalletAccountState>());
  const handledRefreshNonceRef = useRef(refreshNonce);
  const connectionAttemptRef = useRef(0);
  const activeConnectionAttemptRef = useRef<number | null>(null);
  const explorerUrl = publicKey ? getExplorerUrl(publicKey.toBase58(), cluster) : null;

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Cancel any pending copy confirmation timer when the component unmounts. */
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  /**
   * Closes the account dropdown when the user clicks anywhere outside of it.
   * Uses `mousedown` (not `click`) so the handler fires before React's
   * synthetic event bubbling resolves, preventing a race with toggle buttons.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * While the wallet modal is open:
   * - Locks `<body>` scroll to prevent background scrolling on mobile.
   * - Registers an `Escape` key handler to dismiss the modal.
   *
   * Both are cleaned up when the modal closes or the component unmounts.
   */
  useEffect(() => {
    if (!walletModalOpen) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWalletModalOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [walletModalOpen]);

  useEffect(() => {
    if (!connected || !publicKey || !accountDropdownOpen) return;

    let cancelled = false;
    const cacheKey = `${publicKey.toBase58()}:${cluster}`;
    const cachedState = accountCacheRef.current.get(cacheKey);
    const isManualRefresh = refreshNonce !== handledRefreshNonceRef.current;
    handledRefreshNonceRef.current = refreshNonce;

    if (cachedState && !isManualRefresh) {
      setAccountState(cachedState);
      setAccountError(null);
      setAccountLoading(false);
      return;
    }

    async function loadAccountState() {
      if (!publicKey) return;
      setAccountLoading(true);
      setAccountError(null);

      try {
        const url = new URL("/api/wallet-account", window.location.origin);
        url.searchParams.set("address", publicKey.toBase58());
        url.searchParams.set("cluster", cluster);

        const response = await fetch(url);
        const data = (await response.json().catch(() => ({}))) as Partial<WalletAccountState> & {
          error?: string;
        };

        if (!response.ok || data.error) {
          throw new Error(data.error || "Wallet account request failed");
        }
        if (cancelled) return;

        const nextState = {
          accountExists: Boolean(data.accountExists),
          balance: data.balance ?? "0.00000",
        };
        accountCacheRef.current.set(cacheKey, nextState);
        setAccountState(nextState);
      } catch (error) {
        if (cancelled) return;
        setAccountError(
          error instanceof Error ? error.message : "Could not load account data",
        );
        setAccountState(null);
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    }

    loadAccountState();

    return () => {
      cancelled = true;
    };
  }, [accountDropdownOpen, cluster, connected, publicKey, refreshNonce]);

  useEffect(() => {
    if (
      !pendingWalletName ||
      wallet?.adapter.name !== pendingWalletName
    ) {
      return;
    }

    const attempt = connectionAttemptRef.current;
    if (activeConnectionAttemptRef.current === attempt) return;
    activeConnectionAttemptRef.current = attempt;

    void connect()
      .then(() => {
        if (connectionAttemptRef.current !== attempt) return;
        setWalletModalOpen(false);
        setConnectionError(null);
      })
      .catch((error) => {
        if (connectionAttemptRef.current !== attempt) return;
        setConnectionError(
          error instanceof Error ? error.message : "Wallet connection failed.",
        );
      })
      .finally(() => {
        if (connectionAttemptRef.current !== attempt) return;
        activeConnectionAttemptRef.current = null;
        setConnecting(false);
        setConnectingName(null);
        setPendingWalletName(null);
      });
  }, [connect, pendingWalletName, wallet?.adapter.name]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Closes the account dropdown and opens the wallet selection modal.
   * Stable reference via `useCallback` so it can safely be passed to child
   * button elements without causing unnecessary re-renders.
   */
  const openModal = useCallback(() => {
    setAccountDropdownOpen(false);
    setWalletModalOpen(true);
  }, []);

  /**
   * Copies the connected wallet's base-58 public key to the system clipboard
   * and activates a brief ✓ confirmation for 1.5 seconds.
   */
  const handleCopy = useCallback(async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setIsCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [publicKey]);

  /**
   * Wallets that are already installed in the browser (ready to connect).
   * Memoised so the filter does not run on every render.
   */
  const installedWallets = useMemo(
    () => wallets.filter((w) => w.readyState === "Installed" || w.readyState === "Loadable"),
    [wallets],
  );

  /**
   * Wallets that are not installed — shown as "Install →" links in the modal.
   * Memoised together with `installedWallets` to share the same `wallets` dep.
   */
  const otherWallets = useMemo(
    () => wallets.filter((w) => w.readyState !== "Installed" && w.readyState !== "Loadable"),
    [wallets],
  );

  /**
   * Truncated address in `AAAA···ZZZZ` format shown in the connected pill and
   * account dropdown header. Recomputed only when the connected public key changes.
   */
  const truncated = useMemo(
    () =>
      publicKey
        ? publicKey.toBase58().slice(0, 4) + "···" + publicKey.toBase58().slice(-4)
        : "",
    [publicKey],
  );

  /**
   * Selects the chosen adapter and attempts to establish a connection.
   * Shows a spinner next to the wallet name while the handshake is in progress.
   *
   * @param walletName - The adapter name (e.g. `"Phantom"`, `"Solflare"`).
   */
  const handleSelectWallet = useCallback(
    (walletName: WalletName<string>) => {
      const browseUrl = getWalletBrowseUrl(
        walletName,
        window.location.href,
        window.location.origin,
      );

      if (isMobile && browseUrl && !hasMobileProvider(walletName)) {
        window.location.href = browseUrl;
        return;
      }

      connectionAttemptRef.current += 1;
      setConnectionError(null);
      setConnecting(true);
      setConnectingName(walletName);
      setPendingWalletName(walletName);
      select(walletName);
    },
    [isMobile, select],
  );

  const handleRefreshAccount = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);


  return (
    <>
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* ── Connected state ── */}
        {connected ? (
          <div className="relative z-40" ref={dropdownRef}>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              aria-expanded={accountDropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/7 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/11 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
            >
              <span className="w-1.75 h-1.75 rounded-full bg-emerald-400 shadow-[0_0_0_2.5px_rgba(52,211,153,0.3)] shrink-0" />
              {wallet?.adapter?.icon && (
                <span className="w-5.5 h-5.5 rounded-md overflow-hidden shrink-0">
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name || "Wallet"}
                    width={22}
                    height={22}
                    className="h-full w-full object-contain"
                  />
                </span>
              )}
              <span className="font-mono text-[12.5px] tracking-wide text-zinc-500 dark:text-zinc-400">
                {truncated}
              </span>
              <ChevronDown
                size={13}
                className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                  accountDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Account dropdown */}
            {accountDropdownOpen && (
              <div
                className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-zinc-200 dark:border-white/8 bg-white dark:bg-[#111113] shadow-lg dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                role="menu"
              >
                {/* Panel header */}
                <div className="flex flex-col items-center gap-2.5 px-4 pt-5 pb-4 bg-zinc-50 dark:bg-[#17171a] border-b border-zinc-100 dark:border-white/6">
                  <div className="flex items-center justify-center w-11 h-11 rounded-[14px] overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0">
                    {wallet?.adapter?.icon ? (
                      <img
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name || "Wallet"}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950">
                        <Wallet size={20} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                  {wallet?.adapter?.name && (
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {wallet.adapter.name}
                    </span>
                  )}
                  {/* Address copy row */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy address"
                    className="flex items-center justify-between gap-2 w-full px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/6 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
                  >
                    <span className="font-mono text-[12px] tracking-wider text-zinc-700 dark:text-zinc-200">
                      {truncated}
                    </span>
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      {isCopied ? (
                        <Check size={13} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Copy
                          size={13}
                          className="text-zinc-400 dark:text-zinc-500 shrink-0"
                        />
                      )}
                    </span>
                  </button>
                </div>

                <div className="p-3 border-b border-zinc-100 dark:border-white/6">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 dark:bg-white/6 p-1">
                    {CLUSTERS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCluster(item.value)}
                        className={`h-8 rounded-lg text-[11px] font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15 ${
                          cluster === item.value
                            ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-zinc-100 dark:border-white/6 bg-zinc-50 dark:bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Balance
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshAccount}
                        disabled={accountLoading}
                        aria-label="Refresh account data"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/6 dark:hover:text-zinc-200 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
                      >
                        <RefreshCw
                          size={13}
                          className={accountLoading ? "animate-spin" : ""}
                        />
                      </button>
                    </div>

                    {accountLoading ? (
                      <div className="mt-2 space-y-2">
                        <div className="h-7 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" />
                        <div className="h-3 w-36 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" />
                      </div>
                    ) : accountError ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-red-400">
                          {accountError}
                        </span>
                        <button
                          type="button"
                          onClick={handleRefreshAccount}
                          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15 rounded-md"
                        >
                          Retry
                        </button>
                      </div>
                    ) : accountState && !accountState.accountExists ? (
                      <div className="mt-2 rounded-lg bg-zinc-100 dark:bg-white/6 px-2.5 py-2">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                          Account not found
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                          No account exists on {CLUSTERS.find((item) => item.value === cluster)?.label}.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="font-mono text-[22px] font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                            {accountState?.balance ?? "0"}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                            SOL
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                          {CLUSTERS.find((item) => item.value === cluster)?.label} cluster
                        </p>
                      </>
                    )}
                  </div>

                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openModal}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
                  >
                    <span className="w-7.5 h-7.5 rounded-[9px] flex items-center justify-center bg-zinc-100 dark:bg-white/6 shrink-0">
                      <Wallet
                        size={14}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                    </span>
                    Change Wallet
                  </button>

                  {explorerUrl ? (
                    <a
                      role="menuitem"
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
                    >
                      <span className="w-7.5 h-7.5 rounded-[9px] flex items-center justify-center bg-zinc-100 dark:bg-white/6 shrink-0">
                        <Wallet
                          size={14}
                          className="text-zinc-500 dark:text-zinc-400"
                        />
                      </span>
                      View on Explorer
                    </a>
                  ) : null}

                  <div className="h-px bg-zinc-100 dark:bg-white/6 mx-1.5 my-1" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountDropdownOpen(false);
                      disconnect();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/7 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/25"
                  >
                    <span className="w-7.5 h-7.5 rounded-[9px] flex items-center justify-center bg-red-50 dark:bg-red-500/8 shrink-0">
                      <LogOut size={14} className="text-red-400" />
                    </span>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Disconnected state ── */
          <button
            type="button"
            onClick={openModal}
            aria-label="Connect wallet"
            className="flex items-center gap-2 px-4 py-2.25 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:opacity-80 active:opacity-100 active:scale-[0.98] text-white dark:text-zinc-900 text-[13.5px] font-semibold tracking-tight transition-[background-color,color,opacity,transform,box-shadow] duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
          >
            <Wallet size={14} />
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}

        {/* ── Mobile menu toggle ── */}
        <button
          type="button"
          onClick={() => onMenuToggle?.(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="md:hidden flex items-center justify-center w-9.5 h-9.5 rounded-[10px] bg-zinc-100 dark:bg-white/7 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/11 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Wallet selection modal ── */}
      {walletModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setWalletModalOpen(false)}
        >
          <div
            className="relative w-full max-w-90 rounded-2xl bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/8 shadow-xl dark:shadow-[0_32px_100px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Connect Wallet"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4.5 py-4 bg-zinc-50 dark:bg-[#17171a] border-b border-zinc-100 dark:border-white/6">
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Connect Wallet
              </h2>
              <button
                type="button"
                onClick={() => setWalletModalOpen(false)}
                aria-label="Close"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/6 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-2.5 max-h-90 overflow-y-auto [scrollbar-width:thin]">
              {connectionError ? (
                <p
                  role="alert"
                  className="mx-1 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/8 dark:text-red-300"
                >
                  {connectionError}
                </p>
              ) : null}
              {wallets.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-5 text-center">
                  <div className="w-12 h-12 rounded-[14px] bg-zinc-100 dark:bg-white/6 flex items-center justify-center mb-1">
                    <Wallet
                      size={22}
                      className="text-zinc-400 dark:text-zinc-500"
                    />
                  </div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    No wallets found
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Install a Solana wallet extension to continue
                  </p>
                </div>
              ) : (
                <>
                  {/* Installed wallets */}
                  {installedWallets.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2.5 py-1">
                        Detected
                      </p>
                      {installedWallets.map((w) => {
                        const isConnecting =
                          connecting && connectingName === w.adapter.name;
                        return (
                          <button
                            type="button"
                            key={w.adapter.name}
                            onClick={() => handleSelectWallet(w.adapter.name)}
                            disabled={connecting}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:focus-visible:ring-zinc-50/15"
                          >
                            <span className="flex items-center justify-center w-9 h-9 rounded-[10px] overflow-hidden border border-zinc-200 dark:border-white/8 shrink-0 p-px">
                              <img
                                src={w.adapter.icon}
                                alt={w.adapter.name}
                                width={30}
                                height={30}
                                className="h-full w-full object-contain"
                              />
                            </span>
                            <span className="flex-1 text-[14px] font-medium text-left text-zinc-800 dark:text-zinc-100">
                              {w.adapter.name}
                            </span>
                            {isConnecting ? (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#818cf8"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="shrink-0 animate-spin"
                              >
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                              </svg>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                                Installed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Other wallets */}
                  {otherWallets.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2.5 py-1">
                        More wallets
                      </p>
                      {otherWallets.map((w) => {
                        const browseUrl =
                          typeof window === "undefined"
                            ? null
                            : getWalletBrowseUrl(
                                w.adapter.name,
                                window.location.href,
                                window.location.origin,
                              );
                        const href =
                          isMobile && browseUrl ? browseUrl : w.adapter.url;

                        return (
                          <a
                            key={w.adapter.name}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors duration-150 no-underline group"
                          >
                            <span className="w-9 h-9 rounded-[10px] overflow-hidden border border-zinc-200 dark:border-white/8 shrink-0">
                              <img
                                src={w.adapter.icon}
                                alt={w.adapter.name}
                                width={36}
                                height={36}
                                className="h-full w-full object-contain"
                              />
                            </span>
                            <span className="flex-1 text-[14px] font-medium text-left text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors duration-150">
                              {w.adapter.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                              {isMobile && browseUrl ? "Open →" : "Install →"}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-4.5 py-3 border-t border-zinc-100 dark:border-white/6 text-center">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Use the account menu to copy your address, switch wallets, or open Explorer.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
