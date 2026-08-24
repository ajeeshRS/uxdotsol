"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="h-11 w-11 rounded-lg"
        style={{
          background: "var(--surface-secondary)",
          border: "1px solid var(--border-default)",
        }}
      />
    );
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="link-muted relative inline-flex h-11 w-11 items-center justify-center rounded-lg transition-[background-color,color,border-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
      style={{ border: "1px solid var(--border-default)" }}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span
        aria-hidden="true"
        className={`absolute transition-[opacity,transform,filter] duration-150 ease-[var(--ease-out)] motion-reduce:transform-none motion-reduce:blur-0 ${
          resolvedTheme === "dark"
            ? "rotate-0 scale-100 opacity-100 blur-0"
            : "-rotate-45 scale-95 opacity-0 blur-[2px]"
        }`}
      >
        <Sun className="h-4 w-4" />
      </span>
      <span
        aria-hidden="true"
        className={`absolute transition-[opacity,transform,filter] duration-150 ease-[var(--ease-out)] motion-reduce:transform-none motion-reduce:blur-0 ${
          resolvedTheme === "dark"
            ? "rotate-45 scale-95 opacity-0 blur-[2px]"
            : "rotate-0 scale-100 opacity-100 blur-0"
        }`}
      >
        <Moon className="h-4 w-4" />
      </span>
    </button>
  );
}
