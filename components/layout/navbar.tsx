"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FaGithub } from "react-icons/fa6";
import { SearchCommand } from "@/components/layout/search-command";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
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
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 w-full transition-[background-color,backdrop-filter] duration-200 ease-[var(--ease-out)]",
        "sticky top-0",
        scrolled
          ? isHome
            ? "bg-transparent"
            : "divider-fade-bottom bg-(--bg-primary)/80 backdrop-blur-[20px]"
          : "bg-transparent"
      )}
      style={{ height: "72px" }}
    >
      <div className="mx-auto flex h-full w-full items-center px-4 sm:px-8">
        <motion.div
          initial={false}
          animate={{
            maxWidth: isHome ? (scrolled ? 1280 : 1120) : 1280,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", duration: 0.5, bounce: 0.2 }
          }
          className={cn(
            "mx-auto flex w-full items-center",
            isHome
              ? "h-14 rounded-2xl bg-black/35 px-3 shadow-[0_12px_36px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:px-4"
              : "h-full",
          )}
        >
          <div className="flex h-full w-full items-center">
        <Link
          href="/"
          aria-label="UX.SOL home"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-2 transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none"
        >
          <span aria-hidden="true" className="relative block size-7 overflow-hidden">
            {isHome ? (
              <Image
                src="/uxsol-logo-on-dark.png"
                alt=""
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <>
                <Image
                  src="/uxsol-logo-on-light.png"
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover dark:hidden"
                />
                <Image
                  src="/uxsol-logo-on-dark.png"
                  alt=""
                  fill
                  sizes="28px"
                  className="hidden object-cover dark:block"
                />
              </>
            )}
          </span>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: isHome ? "rgba(255,255,255,0.95)" : "var(--text-primary)" }}
          >
           UX.SOL
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
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
                  "inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none sm:px-3",
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

          <div className="flex items-center gap-1 sm:gap-2">
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
              "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none",
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
          </div>
        </motion.div>
      </div>
    </header>
  );
}
