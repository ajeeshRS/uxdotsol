"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsSidebarNav } from "@/app/docs/_components/docs-nav";
import { cn } from "@/lib/utils";

export function DocsLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div
      className={cn(
        "container mx-auto flex-1 items-start px-5 sm:px-8 lg:px-10 xl:px-12",
        "max-w-[1360px] md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12"
      )}
    >
      {pathname.startsWith("/docs") && (
        <>
          <nav
            aria-label="Documentation navigation"
            className="no-scrollbar sticky top-[72px] z-30 -mx-5 flex overflow-x-auto border-b border-[var(--border-default)] bg-[var(--bg-primary)] px-5 md:hidden"
          >
            {[
              { href: "/docs", label: "Overview" },
              { href: "/docs/installation", label: "Installation" },
              { href: "/registry", label: "Registry" },
            ].map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-12 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-[border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transform-none",
                    isActive
                      ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <aside className="no-scrollbar fixed top-[72px] z-30 -ml-2 hidden h-[calc(100vh-72px)] w-full shrink-0 overflow-y-auto pb-24 md:sticky md:block">
            <div className="pt-8 pr-2">
              <DocsSidebarNav />
            </div>
          </aside>
        </>
      )}

      <div className="relative min-w-0 py-8 md:col-start-2 lg:gap-10 lg:py-12">
        <div className="mx-auto w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
