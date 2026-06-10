"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  GitBranch,
  LayoutTemplate,
  Terminal,
  WalletCards,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;
const installCommand =
  "pnpm dlx shadcn@latest add https://uxdotsol.xyz/r/quick-send-flow.json";
const library = [
  {
    href: "/docs/components/button",
    label: "Components",
    body: "Reusable UI foundations for polished Solana product screens.",
    icon: Boxes,
  },
  {
    href: "/docs/hooks/use-smart-retry",
    label: "Hooks",
    body: "State and interaction logic for transaction-heavy experiences.",
    icon: GitBranch,
  },
  {
    href: "/docs/flows/quick-send-flow",
    label: "Flows",
    body: "Guided wallet actions with clear review, progress, and completion states.",
    icon: WalletCards,
  },
  {
    href: "/docs/templates/private-transfer",
    label: "Templates",
    body: "Page-level starting points for shipping complete Solana workflows.",
    icon: LayoutTemplate,
  },
];

const faqItems = [
  [
    "Is UX.SOL already usable?",
    "Yes. The public registry currently ships 16 installable items across components, hooks, flows, and templates.",
  ],
  [
    "How is this different from another SDK?",
    "UX.SOL installs readable source code into your project. There is no required runtime, black box, or design-system lock-in.",
  ],
  [
    "How does installation work?",
    "Each item is a registry JSON file that the shadcn CLI resolves with its files, npm packages, supporting routes, and related UX.SOL dependencies.",
  ],
  [
    "Can I use it commercially?",
    "Yes. UX.SOL is open-source and free for personal and commercial projects.",
  ],
] as const;

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const animateIn = (y: number) =>
    reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y };

  return (
    <>
      <section
        aria-labelledby="home-hero-title"
        className="relative isolate -mt-18 flex min-h-svh overflow-hidden px-4 text-white sm:px-8"
        style={{
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.32)_44%,rgba(0,0,0,0.04)_100%)]" /> */}
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-black/35 to-transparent" />

        <div className="mx-auto flex min-h-svh w-full max-w-300 flex-col pb-7 pt-28 sm:pb-8 sm:pt-32 lg:pt-34">
          <div className="grid flex-1 grid-rows-[auto_1fr_auto] gap-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-start">
              <div className="max-w-190">
                <motion.p
                  initial={animateIn(8)}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="mb-5 text-[12px] font-semibold uppercase leading-none tracking-[0.12em] text-white/76 sm:text-[13px]"
                >
                  Open-source experience kit for Solana
                </motion.p>

                <motion.h1
                  id="home-hero-title"
                  initial={animateIn(16)}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.08, ease }}
                  className="max-w-[10.8em] text-balance text-[42px] font-semibold leading-[0.98] tracking-normal text-white sm:text-[64px] md:text-[78px] lg:text-[88px]"
                >
                  Build better Solana experiences.
                </motion.h1>

                <motion.p
                  initial={animateIn(10)}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18, ease }}
                  className="mt-6 max-w-140 text-pretty text-[15px] leading-7 text-white/72 sm:text-[16px]"
                >
                  UX.SOL helps teams ship clearer Solana product experiences
                  with installable UI and interaction logic they can own,
                  adapt, and build on.
                </motion.p>

                <motion.div
                  initial={animateIn(10)}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.24, ease }}
                  className="mt-9 flex flex-wrap items-center gap-3"
                >
                  <Link
                    href="/registry"
                    className="group/cta inline-flex min-h-14 items-center gap-4 rounded-xl border border-white/12 bg-white pl-7 pr-2 text-[15px] font-semibold leading-none text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Explore registry
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-black transition duration-200 group-hover/cta:-rotate-45 group-hover/cta:bg-black group-hover/cta:text-white">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                  <Link
                    href="/docs/installation"
                    className="inline-flex min-h-14 items-center rounded-xl border border-white/18 px-6 text-[15px] font-semibold leading-none text-white/82 transition duration-200 hover:-translate-y-0.5 hover:border-white/34 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Install
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={animateIn(14)}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16, ease }}
                className="grid gap-4 pt-1 lg:pt-14"
              >
                <div className="grid gap-3">
                  {library.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group grid grid-cols-[40px_1fr_auto] items-center gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/16 bg-white/7">
                        <item.icon
                          className="h-4 w-4 text-white/76"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold leading-5 text-white">
                          {item.label}
                        </span>
                        <span className="block max-w-90 text-[13px] leading-5 text-white/56">
                          {item.body}
                        </span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-white/38 transition group-hover:translate-x-1 group-hover:text-white/72"
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

            <div />

            <motion.p
              initial={animateIn(10)}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34, ease }}
              className="justify-self-center text-[13px] font-medium text-white/58"
            >
              scroll
            </motion.p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-300">
          <div className="mb-8 grid gap-5 md:grid-cols-[minmax(0,0.72fr)_minmax(260px,0.28fr)] md:items-end lg:mb-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                From primitive to product
              </p>
              <h2
                className="max-w-190 text-balance text-[34px] font-semibold leading-[1.04] tracking-normal sm:text-[44px] lg:text-[52px]"
                style={{ color: "var(--text-primary)" }}
              >
                Everything between connecting a wallet and completing the job.
              </h2>
              <p
                className="max-w-155 text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Start with one utility or install an entire workflow. Every item
                lands in your codebase, follows your design system, and remains
                yours to change.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {library.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-58 flex-col rounded-4xl border border-[#f4f4f4] bg-white p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-[#eaeaea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-[#141414] dark:bg-neutral-950 dark:hover:border-[#1c1c1c]"
              >
                <div className="mb-10 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#f4f4f4] bg-white dark:border-[#141414] dark:bg-black">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-muted-foreground transition group-hover:-rotate-45 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-auto">
                  <h3
                    className="mb-2 text-[17px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </h3>
                  <p
                    className="text-sm leading-6"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-300 overflow-hidden rounded-[38px] border border-[#ededed] bg-[#f8f8f8] dark:border-[#171717] dark:bg-[#080808]">
          <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)]">
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Open infrastructure
                </p>
                <h2
                  className="mt-5 max-w-130 text-balance text-[34px] font-semibold leading-[1.04] sm:text-[46px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  One command. Readable source. No lock-in.
                </h2>
                <p
                  className="mt-5 max-w-125 text-sm leading-7"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Registry items include their files, npm dependencies, related
                  UX.SOL items, API routes, and environment requirements. Teams
                  can inspect every line before it reaches production.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/docs/installation" className="btn-primary">
                  Read installation
                </Link>
                <a
                  href="https://github.com/ajeeshRS/uxdotsol"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Inspect GitHub
                </a>
              </div>
            </div>

            <div className="border-t border-[#e8e8e8] bg-black p-5 text-white dark:border-[#171717] sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-white/64">
                  <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                  terminal
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Ready
                </span>
              </div>
              <div className="space-y-6 py-6 font-mono text-xs leading-6 sm:text-[13px]">
                <p className="text-white/72">
                  <span className="text-emerald-300">$</span> {installCommand}
                </p>
                <div className="space-y-2 text-white/48">
                  <p>[ok] Resolving registry dependencies</p>
                  <p>[ok] Installing lucide-react and @solana/web3.js</p>
                  <p>[ok] Adding transaction hooks</p>
                  <p>[ok] Writing quick-send-flow.tsx</p>
                </div>
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-emerald-200">
                  Success. The workflow is now part of your app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-auto w-full max-w-300 px-4 py-16 sm:px-8 lg:py-20">
        <h2
          className="text-xl font-semibold tracking-normal sm:text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          FAQ
        </h2>

        <div className="mt-5 grid w-full gap-4">
          {faqItems.map(([title, body], index) => {
            const isOpen = openFaqIndex === index;
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={title}
                className={`w-full overflow-hidden rounded-[30px] border bg-white transition duration-300 ease-out dark:bg-neutral-950 ${
                  isOpen
                    ? "border-[#eaeaea] dark:border-[#1c1c1c]"
                    : "border-[#f4f4f4] dark:border-[#141414]"
                }`}
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-6"
                >
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {title}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-5 pb-5 pt-0 sm:px-6"
                >
                  <p
                    className="text-sm leading-6"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
