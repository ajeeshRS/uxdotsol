"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TerminalCodeBlock from "@/app/docs/_components/terminal-code-block";
import { createRegistryInstallCommands } from "@/lib/install-commands";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "how-it-works", title: "How it works" },
  { id: "install-an-item", title: "Install an item" },
  { id: "next-steps", title: "Next steps" },
];

export default function DocsPage() {
  const sectionItems = useMemo(() => sections, []);
  const [activeSection, setActiveSection] = useState(sectionItems[0].id);

  useEffect(() => {
    const elements = sectionItems
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionItems]);

  return (
    <div className="grid gap-10 pb-16 xl:grid-cols-[minmax(0,1fr)_220px]">
      <article className="min-w-0 space-y-12">
        <section id="introduction" className="scroll-m-24 space-y-4">
          <p className="text-eyebrow">Introduction</p>
          <h1
            className="scroll-m-20 text-balance text-[42px] font-semibold leading-tight tracking-normal sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Build with UX.SOL
          </h1>
          <p
            className="max-w-[680px] text-pretty text-lg leading-8"
            style={{ color: "var(--text-secondary)" }}
          >
            UX.SOL is an open-source registry of Solana-focused UI components,
            hooks, API helpers, flows, and templates. It helps builders
            ship polished wallet, transaction, token, payment, and asset
            experiences without rebuilding the same UX primitives from scratch.
          </p>
        </section>

        <section id="how-it-works" className="scroll-m-24 space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How it works
          </h2>
          <div
            className="max-w-[720px] space-y-4 text-base leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>
              UX.SOL follows a shadcn-style model: install only what you need,
              copy the code into your app, and fully own the implementation.
            </p>
            <p>
              The docs explain each item, while the registry browser is for
              quickly searching and opening the item you want.
            </p>
          </div>
        </section>
        <section id="install-an-item" className="scroll-m-24 space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Install an item
          </h2>
          <TerminalCodeBlock
            code="npx shadcn@latest add https://uxdotsol.xyz/r/{item-name}.json"
            packageManagerCommands={createRegistryInstallCommands(
              "{item-name}",
            )}
            label="terminal"
          />
        </section>

        <section id="next-steps" className="scroll-m-24 space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Next steps
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/registry" className="btn-primary">
              Browse registry
            </Link>
            <Link href="/docs/installation" className="btn-secondary">
              Read installation
            </Link>
          </div>
        </section>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-28 p-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
            On this page
          </p>
          <nav className="mt-3 grid gap-1" aria-label="On this page">
            {sectionItems.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={
                  activeSection === section.id ? "location" : undefined
                }
                className="rounded-xl px-3 py-2 text-sm text-neutral-500 transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] hover:text-neutral-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none dark:text-neutral-400 dark:hover:bg-black dark:hover:text-white"
                style={{
                  background:
                    activeSection === section.id
                      ? "var(--surface-secondary)"
                      : "transparent",
                  color:
                    activeSection === section.id
                      ? "var(--text-primary)"
                      : undefined,
                }}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
