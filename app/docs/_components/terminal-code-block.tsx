"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  PACKAGE_MANAGERS,
  type PackageManager,
  type PackageManagerCommands,
} from "@/lib/install-commands";

type TerminalCodeBlockProps = {
  code: string;
  label?: string;
  className?: string;
  packageManagerCommands?: PackageManagerCommands;
  collapsible?: boolean;
};

export default function TerminalCodeBlock({
  code,
  label = "terminal",
  className,
  packageManagerCommands,
  collapsible = false,
}: TerminalCodeBlockProps) {
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const copyResetTimer = useRef<number | null>(null);
  const activeCode = packageManagerCommands?.[packageManager] ?? code;
  const canCollapse = collapsible && activeCode.split("\n").length > 22;
  const packageManagerIndex = PACKAGE_MANAGERS.indexOf(packageManager);

  const resetCopyState = () => {
    setCopyState("idle");
    if (copyResetTimer.current) {
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
    copyResetTimer.current = window.setTimeout(() => {
      setCopyState("idle");
      copyResetTimer.current = null;
    }, 1600);
  };

  useEffect(
    () => () => {
      if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
    },
  );

  return (
    <div
      className={`overflow-hidden rounded-[30px] border border-[#f4f4f4] bg-white dark:border-[#141414] dark:bg-neutral-950 ${
        className ?? ""
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f4f4f4] px-5 py-3 dark:border-[#141414]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#eaeaea] dark:bg-[#1c1c1c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eaeaea] dark:bg-[#1c1c1c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eaeaea] dark:bg-[#1c1c1c]" />
          </div>
          <span className="text-[0.78rem] font-medium text-neutral-400 dark:text-neutral-600">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {packageManagerCommands ? (
            <div
              className="relative grid grid-cols-4 items-center rounded-xl bg-[var(--surface-secondary)] p-1 dark:bg-black"
              role="group"
              aria-label="Package manager"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-in-out)] motion-reduce:transition-none dark:bg-neutral-900"
                style={{
                  width: "calc((100% - 0.5rem) / 4)",
                  transform: `translateX(${packageManagerIndex * 100}%)`,
                }}
              />
              {PACKAGE_MANAGERS.map((manager) => (
                <button
                  key={manager}
                  type="button"
                  aria-pressed={packageManager === manager}
                  onClick={() => {
                    setPackageManager(manager);
                    resetCopyState();
                  }}
                  className={`relative z-10 min-h-9 cursor-pointer rounded-lg px-2.5 font-mono text-[11px] font-medium transition-colors duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    packageManager === manager
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-500 dark:hover:text-white"
                  }`}
                >
                  {manager}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            aria-label={
              copyState === "error"
                ? "Copy failed. Select the code manually."
                : copyState === "copied"
                  ? "Code copied"
                  : "Copy code"
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-500 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] hover:text-neutral-950 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:text-neutral-500 dark:hover:bg-black dark:hover:text-white"
          >
            <span className="relative size-3.5" aria-hidden="true">
              <Copy
                size={14}
                className={`absolute inset-0 transition-[opacity,transform,filter] duration-150 ease-[var(--ease-out)] motion-reduce:transform-none motion-reduce:blur-0 ${
                  copyState === "copied"
                    ? "scale-95 opacity-0 blur-[2px]"
                    : "scale-100 opacity-100 blur-0"
                }`}
              />
              <Check
                size={14}
                className={`absolute inset-0 transition-[opacity,transform,filter] duration-150 ease-[var(--ease-out)] motion-reduce:transform-none motion-reduce:blur-0 ${
                  copyState === "copied"
                    ? "scale-100 opacity-100 blur-0"
                    : "scale-95 opacity-0 blur-[2px]"
                }`}
              />
            </span>
            <span aria-live="polite">
              {copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy"}
            </span>
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="relative">
        <pre
          className={`m-3 overflow-x-auto rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] px-5 py-4 dark:bg-black ${
            canCollapse && !isExpanded ? "max-h-[420px] overflow-y-hidden" : ""
          }`}
        >
          <code
            className="font-mono text-[0.82rem] leading-6 text-neutral-800 dark:text-neutral-200 md:text-[0.88rem]"
          >
            {renderCode(activeCode, label)}
          </code>
        </pre>
        {canCollapse && !isExpanded ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex h-28 items-end justify-center rounded-b-[22px] bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent pb-4 dark:from-black dark:via-black/95">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="pointer-events-auto min-h-10 rounded-xl border border-[#eaeaea] bg-white px-4 text-xs font-medium text-neutral-700 shadow-sm transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-neutral-50 hover:text-neutral-950 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:border-[#242424] dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              Expand Code
            </button>
          </div>
        ) : null}
        {canCollapse && isExpanded ? (
          <div className="flex justify-center px-3 pb-3">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="min-h-10 rounded-xl px-4 text-xs font-medium text-neutral-500 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] hover:text-neutral-950 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:text-neutral-400 dark:hover:bg-black dark:hover:text-white"
            >
              Collapse Code
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function renderCode(code: string, label: string) {
  if (!code) return null;

  if (label === "terminal") {
    return (
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--code-accent)", userSelect: "none" }}>$</span>
        <span>{highlightTerminal(code)}</span>
      </div>
    );
  }

  const lines = code.split("\n");
  return lines.map((line, i) => (
    <div key={i}>
      {line ? highlightCodeLine(line) : "\u00a0"}
    </div>
  ));
}

function highlightTerminal(code: string) {
  const [command, ...rest] = code.split(" ");
  return (
    <>
      <span style={{ color: "var(--code-accent-2)" }}>{command}</span>
      {rest.length > 0 ? ` ${rest.join(" ")}` : ""}
    </>
  );
}

function highlightCodeLine(line: string) {
  const parts = line.split(/(".*?"|'.*?'|`.*?`|\b(?:import|export|type|const|let|function|return|from|async|await)\b)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (/^["'`]/.test(part)) {
      return (
        <span key={index} style={{ color: "var(--code-accent-2)" }}>
          {part}
        </span>
      );
    }

    if (/^(import|export|type|const|let|function|return|from|async|await)$/.test(part)) {
      return (
        <span key={index} style={{ color: "var(--code-accent)" }}>
          {part}
        </span>
      );
    }

    return part;
  });
}
