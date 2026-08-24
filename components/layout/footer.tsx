import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

export function Footer() {
  return (
    <footer className="w-full">
      <div className="w-full px-4 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto flex max-w-300 flex-col gap-8">
          <p
            aria-hidden="true"
            className="text-[24vw] font-semibold leading-[0.78] tracking-normal sm:text-[18vw] lg:text-[15.8vw] xl:text-[190px]"
            style={{ color: "var(--text-primary)" }}
          >
            UX.SOL
          </p>

          <div className="flex flex-col gap-6 pt-2 md:flex-row md:items-center md:justify-between">
            <p
              className="max-w-90 text-sm leading-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Open-source Solana UI, hooks, flows, and templates.
            </p>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link href="/registry" className="btn-primary w-full whitespace-nowrap sm:w-auto">
                Browse registry
              </Link>
              <nav
                aria-label="Footer navigation"
                className="flex w-full items-center justify-between gap-2 text-sm font-medium sm:w-auto sm:justify-start"
                style={{ color: "var(--text-secondary)" }}
              >
                <Link
                  href="/docs"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-(--surface-secondary) hover:text-(--text-primary) active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
                >
                  Docs
                </Link>
                <a
                  href="/llms.txt"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-(--surface-secondary) hover:text-(--text-primary) active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
                >
                  For agents
                </a>
                <a
                  href="https://github.com/ajeeshRS/uxdotsol"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-(--surface-secondary) hover:text-(--text-primary) active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
                >
                  GitHub
                </a>
                <ThemeToggle />
              </nav>
            </div>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            &copy; 2026 UX.SOL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
