"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddressDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  address: string;
  truncate?: boolean;
  copyable?: boolean;
}

export function AddressDisplay({
  address,
  truncate = true,
  copyable = true,
  className,
  ...props
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleCopy = useCallback(() => {
    if (!copyable) return;
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [address, copyable]);

  const display =
    truncate && address.length > 10
      ? `${address.slice(0, 4)}…${address.slice(-4)}`
      : address;

  return (
    <span
      role={copyable ? "button" : undefined}
      tabIndex={copyable ? 0 : undefined}
      aria-label={copyable ? `Copy address ${address}` : undefined}
      title={address}
      data-state={copied ? "copied" : "idle"}
      onClick={handleCopy}
      onKeyDown={copyable ? (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCopy(); }
      } : undefined}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm text-neutral-600 transition-colors duration-150 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300",
        copyable && [
          "cursor-pointer select-none",
          "hover:bg-neutral-50 dark:hover:bg-neutral-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-100/15",
          "active:translate-y-px",
        ],
        className,
      )}
      {...props}
    >
      <span className="truncate">{display}</span>
      {copyable && (
        copied
          ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-emerald-500" />
          : <Copy size={14} className="shrink-0 opacity-40" />
      )}
    </span>
  );
}
// "use client";

// /**
//  * @file AddressDisplay — a lightweight inline component for rendering and
//  * optionally copying Solana (or any) wallet / program addresses.
//  *
//  * @module uxdotsol/components/address-display
//  */

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { Check, Copy } from "lucide-react";
// import { cn } from "@/lib/utils";

// // ---------------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------------

// /**
//  * Props for the {@link AddressDisplay} component.
//  *
//  * Extends all native `<span>` HTML attributes so callers can forward any
//  * standard DOM prop (e.g. `style`, `data-*`) without an explicit allowlist.
//  */
// export interface AddressDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
//   /** The full on-chain address string to display (e.g. a base-58 public key). */
//   address: string;
//   /**
//    * When `true` (default), addresses longer than 10 characters are shortened
//    * to `AAAA...ZZZZ` format for readability.
//    */
//   truncate?: boolean;
//   /**
//    * When `true` (default), clicking the element copies the **full** address
//    * to the clipboard and shows a brief ✓ confirmation icon.
//    */
//   copyable?: boolean;
// }

// // ---------------------------------------------------------------------------
// // Component
// // ---------------------------------------------------------------------------

// /**
//  * Renders a Solana address as an inline pill with optional truncation and
//  * one-click clipboard copy support.
//  *
//  * The component is fully accessible: when `copyable` is `true` it receives
//  * `role="button"` and responds to `Enter` / `Space` keyboard events, matching
//  * the ARIA authoring practices for interactive elements that are not `<button>`
//  * elements by nature.
//  *
//  * @param props - {@link AddressDisplayProps}
//  *
//  * @example
//  * // Truncated + copyable (defaults)
//  * <AddressDisplay address="So11111111111111111111111111111111111111112" />
//  *
//  * @example
//  * // Full address, not copyable
//  * <AddressDisplay address={myAddress} truncate={false} copyable={false} />
//  */
// export function AddressDisplay({
//   address,
//   truncate = true,
//   copyable = true,
//   className,
//   ...props
// }: AddressDisplayProps) {
//   const [copied, setCopied] = useState(false);

//   /**
//    * Stores the pending reset-timer ID so it can be cancelled on unmount,
//    * preventing a state update on an already-unmounted component.
//    */
//   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   /** Cancel any pending timer when the component unmounts. */
//   useEffect(() => {
//     return () => {
//       if (timerRef.current) clearTimeout(timerRef.current);
//     };
//   }, []);

//   /**
//    * Writes the full address to the system clipboard and shows a temporary
//    * confirmation icon. Uses `useCallback` so child elements that receive this
//    * handler won't re-render unnecessarily when the parent re-renders.
//    */
//   const handleCopy = useCallback(() => {
//     if (!copyable) return;
//     navigator.clipboard.writeText(address).catch(() => {});
//     setCopied(true);
//     // Clear any previous timer before scheduling a new one to avoid multiple
//     // concurrent timeouts that could race and flip the icon prematurely.
//     if (timerRef.current) clearTimeout(timerRef.current);
//     timerRef.current = setTimeout(() => setCopied(false), 2000);
//   }, [address, copyable]);

//   /**
//    * The address string actually rendered to the DOM — either truncated to
//    * `AAAA...ZZZZ` or the full value, depending on the `truncate` prop.
//    */
//   const displayAddress =
//     truncate && address.length > 10
//       ? `${address.slice(0, 4)}...${address.slice(-4)}`
//       : address;

//   return (
//     <span
//       onClick={handleCopy}
//       role={copyable ? "button" : undefined}
//       tabIndex={copyable ? 0 : undefined}
//       onKeyDown={copyable ? (e) => {
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault();
//           handleCopy();
//         }
//       } : undefined}
//       aria-label={copyable ? `Copy address ${address}` : undefined}
//       title={address}
//       data-state={copied ? "copied" : "idle"}
//       className={cn(
//         "inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-mono text-neutral-600 shadow-sm transition-[background-color,border-color,color,transform] duration-150 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300",
//         copyable && "cursor-pointer hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-100/15 dark:focus-visible:ring-offset-neutral-950",
//         copied && "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400",
//         className,
//       )}
//       {...props}
//     >
//       <span className="truncate">{displayAddress}</span>
//       {/* Show a checkmark briefly after copy, otherwise show the copy icon. */}
//       {copyable ? (
//         copied ? (
//           <Check size={14} className="text-emerald-500" />
//         ) : (
//           <Copy size={14} className="opacity-50" />
//         )
//       ) : null}
//     </span>
//   );
// }
