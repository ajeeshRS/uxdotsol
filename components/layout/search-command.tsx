"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { docComponents } from "@/lib/docs";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const portalRoot = typeof document === "undefined" ? null : document.body;

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) closeSearch();
        else setOpen(true);
      }
      if (e.key === "Escape" && open) closeSearch();
      if (e.key === "Tab" && open) {
        const dialog = document.getElementById("search-command-dialog");
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [closeSearch, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return docComponents.filter(
      (item) =>
        !normalizedQuery ||
        item.title?.toLowerCase().includes(normalizedQuery) ||
        item.name?.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const handleSelect = (slug: string) => {
    closeSearch();
    const item = docComponents.find((d) => d.name === slug);
    let routeFolder = "components";
    if (item?.files?.[0]?.path.includes("hooks")) routeFolder = "hooks";
    else if (item?.files?.[0]?.path.includes("flows")) routeFolder = "flows";
    else if (item?.files?.[0]?.path.includes("templates"))
      routeFolder = "templates";
    router.push(`/docs/${routeFolder}/${slug}`);
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overscroll-contain px-4 pt-[15vh] sm:pt-[20vh]">
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={closeSearch}
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          <motion.div
            id="search-command-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            initial={
              reduceMotion ? false : { opacity: 0, scale: 0.97, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface-primary)",
              border: "1px solid var(--border-strong)",
            }}
          >
            <h2 id="search-dialog-title" className="sr-only">
              Search UX.SOL documentation
            </h2>

            <div className="divider-fade-bottom flex items-center px-4">
              <Search
                className="mr-3 h-4 w-4 shrink-0"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                name="documentation-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation…"
                aria-label="Search documentation"
                aria-controls="search-results"
                className="flex h-14 min-w-0 w-full bg-transparent py-3 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                title="Close search"
                className="ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              id="search-results"
              className="max-h-[60vh] overflow-y-auto overscroll-contain p-2"
            >
              {filteredDocs.length === 0 ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="py-8 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div
                    className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Components &amp; Docs
                  </div>
                  {filteredDocs.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelect(item.name)}
                      className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span
                          className="truncate font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.title}
                        </span>
                        <span
                          className="text-xs truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.description}
                        </span>
                      </div>
                      <ArrowRight
                        className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        style={{ color: "var(--text-muted)" }}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="divider-fade-top flex items-center justify-between px-4 py-2.5 text-xs"
              style={{
                backgroundColor: "var(--surface-secondary)",
                color: "var(--text-muted)",
              }}
            >
              <span>Select a result to open its docs</span>
              <kbd
                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{
                  background: "var(--surface-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                Esc
              </kbd>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        id="search-command-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-11 w-full items-center justify-start rounded-lg px-3 py-1.5 text-sm font-normal transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:pr-10 md:w-40 lg:w-56"
        style={{
          background: "var(--surface-secondary)",
          border: "1px solid var(--border-default)",
          color: "var(--text-muted)",
        }}
      >
        <Search className="mr-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline-flex">Search docs…</span>
        <span className="inline-flex lg:hidden">Search</span>
        <kbd
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded px-1.5 font-mono text-[10px] font-medium sm:flex"
          style={{
            background: "var(--surface-primary)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          <span>⌘</span>K
        </kbd>
      </button>

      {portalRoot ? createPortal(modalContent, portalRoot) : null}
    </>
  );
}
