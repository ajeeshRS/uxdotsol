"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { FaGithub } from "react-icons/fa6";
import { SearchCommand } from "@/components/layout/search-command";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDocsRoute =
    pathname.startsWith("/docs") || pathname.startsWith("/registry");
  const navItems = [
    { href: "/docs", label: "Docs" },
    { href: "/registry", label: "Registry" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 w-full transition-[background-color,backdrop-filter] duration-300",
        isHome ? "relative" : "sticky top-0",
        scrolled
          ? isHome
            ? "bg-transparent"
            : "divider-fade-bottom bg-(--bg-primary)/80 backdrop-blur-[20px]"
          : "bg-transparent"
      )}
      style={{ height: "72px" }}
    >
      <div className="container mx-auto flex h-full max-w-300 items-center px-4 sm:px-8">
        <Link
          href="/"
          aria-label="UX.SOL home"
          className="mr-2 flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:mr-6"
        >
          <div
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: isHome
                ? "rgba(255,255,255,0.95)"
                : "var(--text-primary)",
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: isHome ? "#0a0a0a" : "var(--bg-primary)" }}
            />
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: isHome ? "rgba(255,255,255,0.95)" : "var(--text-primary)" }}
          >
           UX.SOL
          </span>
        </Link>

        <nav
          className="flex items-center gap-0.5 sm:gap-1"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/docs"
                ? pathname.startsWith("/docs")
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-3",
                  isHome
                    ? "text-white/70 hover:bg-white/10 hover:text-white"
                    : "text-(--text-secondary) hover:bg-(--surface-secondary) hover:text-(--text-primary)",
                  isActive &&
                    (isHome
                      ? "bg-white/10 text-white"
                      : "bg-(--surface-secondary) text-(--text-primary)"),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          {!isHome && (
            <div className="hidden lg:block">
              <SearchCommand />
            </div>
          )}

          <Link
            href="https://github.com/ajeeshRS/uxdotsol"
            target="_blank"
            rel="noreferrer"
            aria-label="Open UX.SOL on GitHub"
            title="GitHub"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              isHome
                ? "hover:bg-white/10"
                : "hover:bg-(--surface-secondary)",
            )}
            style={{ color: isHome ? "rgba(255,255,255,0.7)" : undefined }}
          >
            <FaGithub className="h-4 w-4" aria-hidden="true" />
          </Link>

          {isDocsRoute && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
