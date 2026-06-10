"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type TerminalCodeBlockProps = {
  code: string;
  label?: string;
  className?: string;
};

export default function TerminalCodeBlock({
  code,
  label = "terminal",
  className,
}: TerminalCodeBlockProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    window.setTimeout(() => setCopyState("idle"), 1600);
  };

  return (
    <div
      className={`overflow-hidden rounded-[30px] border border-[#f4f4f4] bg-white dark:border-[#141414] dark:bg-neutral-950 ${
        className ?? ""
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#f4f4f4] px-5 py-3 dark:border-[#141414]">
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
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-500 transition-colors duration-150 hover:bg-[var(--surface-secondary)] hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-neutral-500 dark:hover:bg-black dark:hover:text-white"
        >
          {copyState === "copied" ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          <span aria-live="polite">
            {copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Copy failed"
                : "Copy"}
          </span>
        </button>
      </div>

      {/* Code area */}
      <pre className="m-3 overflow-x-auto rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] px-5 py-4 dark:bg-black">
        <code
          className="font-mono text-[0.82rem] leading-6 text-neutral-800 dark:text-neutral-200 md:text-[0.88rem]"
        >
          {renderCode(code, label)}
        </code>
      </pre>
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
