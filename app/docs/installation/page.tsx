import type { Metadata } from "next";
import Link from "next/link";
import TerminalCodeBlock from "@/app/docs/_components/terminal-code-block";

export const metadata: Metadata = {
  title: "Installation | UX.SOL",
  description: "Install UX.SOL registry items in a React or Next.js project.",
};

export default function InstallationDocsPage() {
  return (
    <div className="max-w-3xl space-y-10 border-none pb-16">
      <div className="space-y-4">
        <p className="text-eyebrow">Getting started</p>
        <h1 className="scroll-m-20 text-balance border-none text-4xl font-semibold tracking-normal text-neutral-900 dark:text-neutral-50">
          Installation
        </h1>
        <p className="max-w-[640px] text-pretty text-xl leading-relaxed text-muted-foreground">
          Add UX.SOL registry items directly to your app with the shadcn CLI.
        </p>
      </div>

      <ol className="space-y-4 leading-7">
        <li className="space-y-4 rounded-[30px] border border-[#f4f4f4] bg-white p-5 dark:border-[#141414] dark:bg-neutral-950 sm:p-6">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-normal">
            1. Start with a Next.js app
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300">
            UX.SOL is built for React and Next.js App Router projects. Use an
            existing app or create a new one.
          </p>

          <TerminalCodeBlock
            code="npx create-next-app@latest my-solana-app"
            label="terminal"
            className="mt-4"
          />
        </li>

        <li className="space-y-4 rounded-[30px] border border-[#f4f4f4] bg-white p-5 dark:border-[#141414] dark:bg-neutral-950 sm:p-6">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-normal">
            2. Add a registry item
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300">
            Open an item, copy its install command, and run it from your project
            root.
          </p>

          <TerminalCodeBlock
            code="npx shadcn@latest add https://uxdotsol.xyz/r/address-display.json"
            label="terminal"
            className="mt-4"
          />
        </li>

        <li className="space-y-4 rounded-[30px] border border-[#f4f4f4] bg-white p-5 dark:border-[#141414] dark:bg-neutral-950 sm:p-6">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-normal">
            3. Use the copied files
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300">
            Each item declares its files and dependencies. After installation,
            import the copied component, hook, flow, or template into your app.
          </p>

          <TerminalCodeBlock
            code={'import { AddressDisplay } from "@/components/address-display";'}
            label="usage"
            className="mt-4"
          />
        </li>
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href="/registry" className="btn-primary">
          Browse registry
        </Link>
        <Link href="/docs" className="btn-secondary">
          Read overview
        </Link>
      </div>
    </div>
  );
}
