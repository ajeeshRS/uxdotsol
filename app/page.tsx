"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Select } from "radix-ui";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Terminal,
} from "lucide-react";

import { EASE_OUT } from "@/lib/motion";

const REVEAL_VARIANTS = {
  hidden: { opacity: 0, transform: "translateY(16px)" },
  reducedHidden: { opacity: 0, transform: "translateY(0)" },
  visible: { opacity: 1, transform: "translateY(0)" },
} as const;
const REVEAL_GROUP_VARIANTS = {
  hidden: {},
  reducedHidden: {},
  visible: {},
} as const;
const REVEAL_VIEWPORT = { once: true, margin: "-100px" } as const;
const REVEAL_TRANSITION = { duration: 0.45, ease: EASE_OUT } as const;
const REDUCED_REVEAL_TRANSITION = { duration: 0.2, ease: "linear" } as const;
const REVEAL_STAGGER = { staggerChildren: 0.06 } as const;
const REDUCED_REVEAL_STAGGER = { staggerChildren: 0 } as const;

const INSTALL_COMMAND_SUFFIX =
  "shadcn@latest add https://uxdotsol.xyz/r/quick-send-flow.json";
const PACKAGE_RUNNERS = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx",
} as const;
type PackageManager = keyof typeof PACKAGE_RUNNERS;
const TERMINAL_OUTPUT = [
  "Resolving registry dependencies",
  "Installing lucide-react and @solana/web3.js",
  "Adding transaction hooks",
  "Writing quick-send-flow.tsx",
] as const;

function ComponentsVector() {
  return (
    <svg className="library-vector h-full w-full" viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <defs>
        <filter id="components-shadow" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6D28D9" floodOpacity="0.09" />
        </filter>
      </defs>
      <rect x="18" y="22" width="96" height="50" rx="14" fill="#FFFFFF" stroke="#EDE9FE" />
      <rect x="31" y="35" width="70" height="24" rx="8" fill="#F5F3FF" />
      <rect x="42" y="44" width="33" height="6" rx="3" fill="#C4B5FD" />
      <circle cx="88" cy="47" r="5" fill="#8B5CF6" />

      <rect x="126" y="22" width="96" height="50" rx="14" fill="#FFFFFF" stroke="#EDE9FE" />
      <rect x="139" y="35" width="70" height="24" rx="8" fill="#F5F3FF" stroke="#DDD6FE" />
      <circle cx="151" cy="47" r="4" fill="#C4B5FD" />
      <rect x="162" y="44" width="31" height="6" rx="3" fill="#DDD6FE" />

      <rect x="18" y="88" width="96" height="50" rx="14" fill="#FFFFFF" stroke="#EDE9FE" />
      <rect x="31" y="102" width="46" height="22" rx="11" fill="#EDE9FE" />
      <circle cx="65" cy="113" r="8" fill="#8B5CF6" />
      <rect x="85" y="108" width="16" height="9" rx="4.5" fill="#DDD6FE" />

      <g className="library-art-motion" filter="url(#components-shadow)">
        <rect x="126" y="88" width="96" height="50" rx="14" fill="#FFFFFF" stroke="#D8B4FE" />
        <rect x="139" y="101" width="70" height="24" rx="8" fill="#7C3AED" />
        <rect x="157" y="110" width="34" height="6" rx="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function HooksVector() {
  return (
    <svg className="library-vector h-full w-full" viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <defs>
        <filter id="hooks-shadow" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6D28D9" floodOpacity="0.08" />
        </filter>
      </defs>
      <rect x="17" y="58" width="92" height="44" rx="14" fill="#FFFFFF" stroke="#EDE9FE" filter="url(#hooks-shadow)" />
      <path d="m32 70-6 10 6 10M94 70l6 10-6 10" stroke="#A78BFA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <text x="63" y="83" textAnchor="middle" fill="#6D28D9" fontSize="7.5" fontWeight="700" fontFamily="ui-monospace, SFMono-Regular, monospace">useSmartRetry</text>

      <path d="M109 80h11c15 0 15-47 34-47h7M120 80h41M120 80c15 0 15 47 34 47h7" stroke="#C4B5FD" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="120" cy="80" r="3.5" fill="#8B5CF6" />
      <g className="library-art-motion">
        <rect x="161" y="19" width="64" height="28" rx="10" fill="#FFFFFF" stroke="#EDE9FE" />
        <circle cx="175" cy="33" r="5" fill="#86EFAC" />
        <rect x="185" y="30" width="27" height="6" rx="3" fill="#DDD6FE" />

        <rect x="161" y="66" width="64" height="28" rx="10" fill="#FFFFFF" stroke="#EDE9FE" />
        <rect x="172" y="76" width="42" height="8" rx="4" fill="#EDE9FE" />
        <rect x="172" y="76" width="24" height="8" rx="4" fill="#8B5CF6" />

        <rect x="161" y="113" width="64" height="28" rx="10" fill="#FFFFFF" stroke="#EDE9FE" />
        <rect x="172" y="121" width="28" height="12" rx="6" fill="#EDE9FE" />
        <circle cx="179" cy="127" r="4.5" fill="#A78BFA" />
        <rect x="207" y="124" width="7" height="6" rx="3" fill="#DDD6FE" />
      </g>
    </svg>
  );
}

function FlowsVector() {
  return (
    <svg className="library-vector h-full w-full" viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <defs>
        <filter id="flows-shadow" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6D28D9" floodOpacity="0.08" />
        </filter>
      </defs>
      <path d="M74 80h16M150 80h16" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
      <g className="library-art-motion">
        <path d="m80 75 5 5-5 5M156 75l5 5-5 5" stroke="#7C3AED" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <rect x="15" y="38" width="58" height="84" rx="14" fill="#FFFFFF" stroke="#EDE9FE" />
      <circle cx="44" cy="65" r="12" fill="#F5F3FF" stroke="#DDD6FE" />
      <path d="M38 65h12M44 59v12" stroke="#7C3AED" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="29" y="91" width="30" height="6" rx="3" fill="#DDD6FE" />
      <rect x="34" y="103" width="20" height="5" rx="2.5" fill="#EDE9FE" />

      <rect x="91" y="31" width="58" height="98" rx="14" fill="#FFFFFF" stroke="#D8B4FE" filter="url(#flows-shadow)" />
      <rect x="104" y="48" width="32" height="7" rx="3.5" fill="#A78BFA" />
      <rect x="104" y="65" width="24" height="5" rx="2.5" fill="#DDD6FE" />
      <rect x="104" y="77" width="32" height="5" rx="2.5" fill="#EDE9FE" />
      <rect x="104" y="96" width="32" height="14" rx="7" fill="#7C3AED" />
      <rect x="113" y="100" width="14" height="6" rx="3" fill="#FFFFFF" />

      <rect x="167" y="38" width="58" height="84" rx="14" fill="#FFFFFF" stroke="#EDE9FE" />
      <circle cx="196" cy="65" r="12" fill="#ECFDF5" stroke="#BBF7D0" />
      <path d="m190 65 4 4 8-9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="181" y="91" width="30" height="6" rx="3" fill="#DDD6FE" />
      <rect x="186" y="103" width="20" height="5" rx="2.5" fill="#EDE9FE" />
    </svg>
  );
}

function TemplatesVector() {
  return (
    <svg className="library-vector h-full w-full" viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <defs>
        <filter id="templates-shadow" x="-15%" y="-25%" width="130%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#6D28D9" floodOpacity="0.09" />
        </filter>
      </defs>
      <rect x="18" y="19" width="204" height="122" rx="16" fill="#FFFFFF" stroke="#EDE9FE" filter="url(#templates-shadow)" />
      <path d="M18 43h204" stroke="#EDE9FE" strokeWidth="1.5" />
      <circle cx="32" cy="31" r="3" fill="#C4B5FD" />
      <circle cx="42" cy="31" r="3" fill="#DDD6FE" />
      <circle cx="52" cy="31" r="3" fill="#EDE9FE" />
      <rect x="31" y="55" width="42" height="73" rx="10" fill="#F5F3FF" />
      <rect x="41" y="67" width="22" height="6" rx="3" fill="#8B5CF6" />
      <rect x="41" y="82" width="17" height="5" rx="2.5" fill="#C4B5FD" />
      <rect x="41" y="95" width="22" height="5" rx="2.5" fill="#DDD6FE" />
      <rect x="41" y="108" width="14" height="5" rx="2.5" fill="#DDD6FE" />

      <g className="library-art-motion">
        <rect x="85" y="55" width="124" height="30" rx="10" fill="#F5F3FF" />
        <rect x="97" y="64" width="48" height="7" rx="3.5" fill="#A78BFA" />
        <rect x="97" y="74" width="31" height="4" rx="2" fill="#DDD6FE" />
        <rect x="85" y="95" width="58" height="33" rx="10" fill="#F5F3FF" />
        <rect x="151" y="95" width="58" height="33" rx="10" fill="#7C3AED" />
        <rect x="164" y="108" width="32" height="7" rx="3.5" fill="#FFFFFF" />
      </g>

      <rect x="174" y="12" width="50" height="20" rx="10" fill="#7C3AED" />
      <path d="m185 18 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.6-3 1.6.5-3.5-2.5-2.5 3.5-.5 1.5-3Z" fill="#FFFFFF" />
      <rect x="194" y="19" width="20" height="6" rx="3" fill="#EDE9FE" />
    </svg>
  );
}

const library = [
  {
    href: "/docs/components/button",
    label: "Components",
    body: "Reusable UI primitives for polished Solana products.",
    art: ComponentsVector,
    artKey: "components",
  },
  {
    href: "/docs/hooks/use-smart-retry",
    label: "Hooks",
    body: "Composable logic for wallet and transaction states.",
    art: HooksVector,
    artKey: "hooks",
  },
  {
    href: "/docs/flows/quick-send-flow",
    label: "Flows",
    body: "Guided sequences for review, progress, and completion.",
    art: FlowsVector,
    artKey: "flows",
  },
  {
    href: "/docs/templates/private-transfer",
    label: "Templates",
    body: "Ready-to-ship foundations for complete product screens.",
    art: TemplatesVector,
    artKey: "templates",
  },
];

const faqItems = [
  [
    "Is UX.SOL already usable?",
    "Yes. The public registry currently ships 41 installable items across components, hooks, flows, and templates.",
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
  const [packageManager, setPackageManager] =
    useState<PackageManager>("pnpm");
  const [copyFeedbackKey, setCopyFeedbackKey] = useState(0);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const copied = copyFeedbackKey > 0;
  const heroInstallCommand = `${PACKAGE_RUNNERS[packageManager]} ${INSTALL_COMMAND_SUFFIX}`;
  const revealInitial = reduceMotion ? "reducedHidden" : "hidden";
  const revealTransition = reduceMotion
    ? REDUCED_REVEAL_TRANSITION
    : REVEAL_TRANSITION;
  const animateIn = (y: number) =>
    reduceMotion
      ? { opacity: 1, transform: "translateY(0)" }
      : { opacity: 0, transform: `translateY(${y}px)` };
  const copyInstallCommand = async () => {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(heroInstallCommand);
      setCopyFeedbackKey((current) => current + 1);

      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => {
        setCopyFeedbackKey(0);
        copyResetTimer.current = null;
      }, 1800);
    } catch {
      // Clipboard access can be denied by the browser or page permissions.
    }
  };
  const selectPackageManager = (manager: PackageManager) => {
    setPackageManager(manager);
    setCopyFeedbackKey(0);

    if (copyResetTimer.current) {
      clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
  };

  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );

  return (
    <>
      <section
        aria-labelledby="home-hero-title"
        className="relative isolate -mt-18 flex min-h-svh items-center overflow-hidden px-4 text-white sm:px-8"
        style={{
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.32)_44%,rgba(0,0,0,0.04)_100%)]" /> */}
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-black/35 to-transparent" />

        <div className="mx-auto flex w-full max-w-7xl items-center justify-center py-24 text-center sm:py-32 lg:py-24">
          <div className="flex w-full max-w-5xl flex-col items-center">
            <motion.h1
                  id="home-hero-title"
                  initial={animateIn(16)}
                  animate={{ opacity: 1, transform: "translateY(0)" }}
                  transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
                  className="max-w-[11em] text-balance text-[38px] font-semibold leading-[0.98] tracking-normal text-white min-[400px]:text-[42px] sm:text-[64px] md:text-[78px] lg:text-[88px]"
                >
                  Build better Solana experiences.
            </motion.h1>

            <motion.p
                  initial={animateIn(10)}
                  animate={{ opacity: 1, transform: "translateY(0)" }}
                  transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT }}
                  className="mt-5 max-w-160 text-pretty text-sm leading-6 text-white/72 sm:mt-6 sm:text-base sm:leading-7"
                >
                  UX.SOL helps teams ship clearer Solana product experiences
                  with installable UI and interaction logic they can own,
                  adapt, and build on.
            </motion.p>

            <motion.div
              initial={animateIn(10)}
              animate={{ opacity: 1, transform: "translateY(0)" }}
              transition={{ duration: 0.5, delay: 0.24, ease: EASE_OUT }}
              className="mt-8 flex w-full max-w-full flex-col gap-3 sm:mt-9 lg:w-fit lg:flex-row"
            >
              <div className="flex min-h-14 w-full min-w-0 items-center gap-2 rounded-2xl bg-white/10 py-1.5 pl-2.5 pr-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:w-auto">
                <Select.Root
                  value={packageManager}
                  onValueChange={(value) =>
                    selectPackageManager(value as PackageManager)
                  }
                >
                  <Select.Trigger
                    aria-label="Package manager"
                    style={{
                      width: `calc(${PACKAGE_RUNNERS[packageManager].length}ch + 46px)`,
                    }}
                    className="group inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-white/8 px-3 font-mono text-[12px] font-medium text-white/74 outline-none transition-[width,background-color,color] duration-250 ease-[var(--ease-in-out)] hover:bg-white/12 hover:text-white focus-visible:bg-white/14 focus-visible:text-white motion-reduce:transition-none"
                  >
                    <Select.Value />
                    <Select.Icon asChild>
                      <ChevronDown
                        className="h-3.5 w-3.5 shrink-0 text-white/46 transition-transform duration-200 ease-[var(--ease-in-out)] group-data-[state=open]:rotate-180 motion-reduce:transform-none"
                        aria-hidden="true"
                      />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={8}
                      className="hero-package-select-content z-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-black/72 p-1.5 text-white shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl outline-none"
                    >
                      <Select.Viewport>
                        {Object.entries(PACKAGE_RUNNERS).map(
                          ([manager, runner]) => (
                            <Select.Item
                              key={manager}
                              value={manager}
                              className="relative flex h-9 cursor-pointer select-none items-center rounded-xl pl-3 pr-8 font-mono text-[12px] text-white/66 outline-none transition-[background-color,color] duration-150 ease-[var(--ease-out)] data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[state=checked]:text-white"
                            >
                              <Select.ItemText>{runner}</Select.ItemText>
                              <Select.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ),
                        )}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                <code
                  className="min-w-0 flex-1 truncate font-mono text-[12px] tracking-[-0.01em] text-white/76 sm:text-[13px] lg:flex-none"
                  title={heroInstallCommand}
                >
                  {INSTALL_COMMAND_SUFFIX}
                </code>
                <button
                  type="button"
                  onClick={copyInstallCommand}
                  aria-label={copied ? "Install command copied" : "Copy install command"}
                  title={copied ? "Copied" : "Copy install command"}
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/8 text-white/58 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-white/14 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transform-none"
                >
                  {copied ? (
                    <svg
                      key={copyFeedbackKey}
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="m4.5 12.5 4.5 4.5L19.5 6.5"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 1, pathLength: 0 }
                        }
                        animate={{ opacity: 1, pathLength: 1 }}
                        transition={
                          reduceMotion
                            ? { duration: 0.15, ease: "linear" }
                            : { duration: 0.25, ease: EASE_OUT }
                        }
                      />
                    </svg>
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                <span className="sr-only" aria-live="polite">
                  {copied ? "Install command copied to clipboard" : ""}
                </span>
              </div>

              <Link
                href="/registry"
                data-arrow-affordance
                className="group/cta inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-4 rounded-xl border border-white/12 bg-white pl-7 pr-2 text-[15px] font-semibold leading-none text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[background-color,scale,box-shadow] duration-200 ease-[var(--ease-out)] hover:bg-white/92 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transform-none lg:w-auto"
              >
                Explore
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-black transition-[background-color,color,transform] duration-250 ease-[var(--ease-in-out)] group-hover/cta:bg-black group-hover/cta:text-white motion-reduce:transform-none motion-reduce:transition-none">
                  <ArrowRight
                    className="landing-arrow-icon h-4 w-4 transition-transform duration-250 ease-[var(--ease-in-out)] motion-reduce:transform-none motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 flex justify-center sm:bottom-8">
          <motion.p
            initial={animateIn(10)}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.5, delay: 0.34, ease: EASE_OUT }}
            className="text-[13px] font-medium text-white/58"
          >
            scroll
          </motion.p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={revealInitial}
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={REVEAL_VARIANTS}
            transition={revealTransition}
            className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end"
          >
            <h2
              className="max-w-190 text-balance text-[32px] font-semibold leading-[1.04] tracking-normal sm:text-[44px] lg:text-[52px]"
              style={{ color: "var(--text-primary)" }}
            >
              Everything between connecting a wallet and completing the job.
            </h2>
            <p
              className="max-w-130 text-sm leading-6 lg:justify-self-end"
              style={{ color: "var(--text-secondary)" }}
            >
              Start with one utility or install an entire workflow. Every item
              lands in your codebase, follows your design system, and remains
              yours to change.
            </p>
          </motion.div>

          <motion.div
            initial={revealInitial}
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={REVEAL_GROUP_VARIANTS}
            transition={
              reduceMotion ? REDUCED_REVEAL_STAGGER : REVEAL_STAGGER
            }
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {library.map((item) => (
              <motion.div
                key={item.label}
                variants={REVEAL_VARIANTS}
                transition={revealTransition}
                className="h-full"
              >
                <Link
                  href={item.href}
                  data-art={item.artKey}
                  data-arrow-affordance
                  className="library-card group relative flex h-full min-h-[340px] flex-col rounded-3xl border border-[#f1f1f1] bg-white p-3 transition-[border-color,transform] duration-150 ease-[var(--ease-out)] hover:border-[#e5e5e5] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none sm:min-h-[370px] dark:border-[#181818] dark:bg-[#0c0c0c] dark:hover:border-[#242424]"
                >
                  <div className="relative h-44 overflow-hidden rounded-2xl bg-[#fafafa] transition-colors duration-200 ease-[var(--ease-out)] group-hover:bg-[#f7f7f7] sm:h-52 dark:bg-white/[0.035] dark:group-hover:bg-white/[0.055]">
                    <item.art />
                  </div>

                  <div className="flex flex-1 flex-col px-2 pb-3 pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.label}
                      </h3>
                      <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7f7f7] text-muted-foreground transition-[background-color,color,transform] duration-250 ease-[var(--ease-in-out)] group-hover:bg-black group-hover:text-white motion-reduce:transform-none motion-reduce:transition-none dark:bg-white/[0.07] dark:group-hover:bg-white dark:group-hover:text-black">
                        <ArrowRight
                          className="landing-arrow-icon block h-4 w-4 transition-transform duration-250 ease-[var(--ease-in-out)] motion-reduce:transform-none motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <p
                      className="mt-3 line-clamp-2 text-sm leading-6"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.body}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_48%,rgba(124,58,237,0.07),transparent_44%)] dark:bg-[radial-gradient(circle_at_50%_48%,rgba(139,92,246,0.09),transparent_44%)]"
          aria-hidden="true"
        />
        <motion.div
          initial={revealInitial}
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          variants={REVEAL_VARIANTS}
          transition={revealTransition}
          className="mx-auto max-w-7xl"
        >
          <div>
            <div className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
              <h2
                className="max-w-190 text-balance text-[32px] font-semibold leading-[1.04] tracking-normal sm:text-[44px] lg:text-[52px]"
                style={{ color: "var(--text-primary)" }}
              >
                One command. Readable source. No lock-in.
              </h2>
              <p
                className="max-w-130 text-sm leading-6 lg:justify-self-end"
                style={{ color: "var(--text-secondary)" }}
              >
                Registry items include source, npm dependencies, related UX.SOL
                items, API routes, and environment requirements. Every line is
                inspectable before it reaches production.
              </p>
            </div>

            <div className="group overflow-hidden rounded-xl border border-white/8 bg-[#0a0a0b] text-white shadow-[0_28px_80px_rgba(0,0,0,0.18),0_0_64px_rgba(124,58,237,0.09)] sm:rounded-2xl">
              <div className="flex h-14 items-center justify-between border-b border-white/8 px-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
                  </div>
                  <span className="flex items-center gap-2 font-mono text-[11px] font-medium text-white/42 sm:text-xs">
                    <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                    terminal
                  </span>
                </div>
              </div>

              <motion.div
                variants={REVEAL_GROUP_VARIANTS}
                transition={
                  reduceMotion ? REDUCED_REVEAL_STAGGER : REVEAL_STAGGER
                }
                className="min-h-[280px] p-4 font-mono text-[11px] leading-6 min-[400px]:text-[12px] sm:min-h-[340px] sm:p-7 sm:text-[13px] lg:p-8"
              >
                <motion.p
                  variants={REVEAL_VARIANTS}
                  transition={revealTransition}
                  className="break-all text-white/78"
                >
                  <span className="mr-2 text-[#a78bfa]">$</span>
                  {heroInstallCommand}
                </motion.p>

                <div className="mt-8 space-y-2.5 text-white/42">
                  {TERMINAL_OUTPUT.map((line) => (
                    <motion.p
                      key={line}
                      variants={REVEAL_VARIANTS}
                      transition={revealTransition}
                    >
                      <span className="mr-3 text-white/22">›</span>
                      {line}
                    </motion.p>
                  ))}
                </div>

                <motion.div
                  variants={REVEAL_VARIANTS}
                  transition={revealTransition}
                  className="mt-8 flex items-start gap-3 border-l-2 border-[#4ade80]/70 py-1 pl-4 text-[#86efac]"
                >
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p>Success. The workflow is now part of your app.</p>
                </motion.div>
              </motion.div>
            </div>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-5">
              <Link href="/docs/installation" className="btn-primary min-h-12 w-full px-6 sm:w-auto">
                Read installation
              </Link>
              <a
                href="https://github.com/ajeeshRS/uxdotsol"
                target="_blank"
                rel="noreferrer"
                className="group/source inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-muted-foreground transition-colors duration-150 ease-[var(--ease-out)] hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto sm:justify-start"
              >
                Inspect source on GitHub
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover/source:translate-x-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={revealInitial}
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={REVEAL_VARIANTS}
            transition={revealTransition}
            className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end"
          >
            <h2
              className="max-w-190 text-balance text-[32px] font-semibold leading-[1.04] tracking-normal sm:text-[44px] lg:text-[52px]"
              style={{ color: "var(--text-primary)" }}
            >
              FAQs.
            </h2>
          </motion.div>

          <motion.div
            initial={revealInitial}
            whileInView="visible"
            viewport={REVEAL_VIEWPORT}
            variants={REVEAL_VARIANTS}
            transition={revealTransition}
            className="grid w-full gap-3"
          >
          {faqItems.map(([title, body], index) => {
            const isOpen = openFaqIndex === index;
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={title}
                className={`w-full overflow-hidden rounded-2xl border bg-white transition-[border-color] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] sm:rounded-3xl dark:bg-[#0c0c0c] ${
                  isOpen
                    ? "border-[#e5e5e5] dark:border-[#242424]"
                    : "border-[#f1f1f1] dark:border-[#181818]"
                }`}
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className={`flex min-h-18 w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-7 ${
                    isOpen
                      ? ""
                      : "hover:bg-black/[0.015] active:bg-black/[0.03] dark:hover:bg-white/[0.025] dark:active:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {title}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f7] text-muted-foreground dark:bg-white/[0.06]">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p
                      className={`max-w-4xl px-5 pb-6 pt-0 text-sm leading-6 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:px-7 ${
                        isOpen ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          </motion.div>
        </div>
      </section>
    </>
  );
}
