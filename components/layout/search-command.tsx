"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { docComponents } from "@/lib/docs";
import { EASE_OUT } from "@/lib/motion";

type DocItem = (typeof docComponents)[number];

const DOC_SECTIONS = {
  components: { folder: "components" },
  hooks: { folder: "hooks" },
  flows: { folder: "flows" },
  templates: { folder: "templates" },
} as const;

function getDocSection(item: DocItem) {
  const path = item.files?.[0]?.path ?? "";

  if (path.includes("hooks")) return DOC_SECTIONS.hooks;
  if (path.includes("flows")) return DOC_SECTIONS.flows;
  if (path.includes("templates")) return DOC_SECTIONS.templates;
  return DOC_SECTIONS.components;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [instantMotion, setInstantMotion] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const portalRoot = typeof document === "undefined" ? null : document.body;

  const openSearch = useCallback((instant = false) => {
    setInstantMotion(instant);
    setOpen(true);
  }, []);

  const closeSearch = useCallback((instant = false) => {
    flushSync(() => setInstantMotion(instant));
    setOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) closeSearch(true);
        else openSearch(true);
      }
      if (e.key === "Escape" && open) closeSearch(true);
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
  }, [closeSearch, open, openSearch]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() =>
      inputRef.current?.focus(),
    );
    return () => {
      window.cancelAnimationFrame(focusFrame);
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
    closeSearch(false);
    const item = docComponents.find((d) => d.name === slug);
    const section = item ? getDocSection(item) : DOC_SECTIONS.components;
    router.push(`/docs/${section.folder}/${slug}`);
  };

  const shouldAnimate = !reduceMotion && !instantMotion;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overscroll-contain px-3 pt-3 sm:px-4 sm:pt-[12vh]">
          <motion.div
            aria-hidden="true"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldAnimate ? 0.14 : 0 }}
            onClick={() => closeSearch(false)}
            className="fixed inset-0 bg-black/55 backdrop-blur-[8px]"
          />

          <motion.div
            id="search-command-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
            initial={
              shouldAnimate
                ? { opacity: 0, transform: "translateY(8px) scale(0.985)" }
                : false
            }
            animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
            exit={{
              opacity: 0,
              transform: "translateY(4px) scale(0.99)",
            }}
            transition={{
              duration: shouldAnimate ? 0.2 : 0,
              ease: EASE_OUT,
            }}
            className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl sm:max-h-[76vh]"
            style={{
              background: "var(--surface-primary)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 24px 72px rgba(0,0,0,0.24)",
              transformOrigin: "center",
            }}
          >
            <h2 id="search-dialog-title" className="sr-only">
              Search documentation
            </h2>

            <div className="divider-fade-bottom flex items-center px-4 sm:px-5">
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
                className="h-16 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
                autoComplete="off"
                spellCheck="false"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="mr-1 inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg px-2.5 text-xs font-medium text-[var(--text-muted)] transition-colors duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => closeSearch(false)}
                aria-label="Close search"
                title="Close search"
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[var(--text-muted)] transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              id="search-results"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3"
            >
              {filteredDocs.length === 0 ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="px-6 py-12 text-center"
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No results for &quot;{query}&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDocs.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelect(item.name)}
                      className="flex min-h-14 w-full cursor-pointer flex-col justify-center rounded-xl px-3 py-2.5 text-left transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-secondary)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 motion-reduce:transform-none sm:px-4"
                    >
                      <span
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
        onClick={() => openSearch(false)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-11 w-full items-center justify-start rounded-lg px-3 py-1.5 text-sm font-normal transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--border-strong)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none sm:pr-10 md:w-40 lg:w-56"
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
