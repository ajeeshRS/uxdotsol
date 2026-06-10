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
      className="link-muted relative inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ border: "1px solid var(--border-default)" }}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
