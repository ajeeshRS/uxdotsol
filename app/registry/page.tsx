import type { Metadata } from "next";
import { DocsHomeExplorer } from "@/app/docs/_components/docs-home-explorer";

export const metadata: Metadata = {
  title: "Registry | UX.SOL",
  description:
    "Search installable UX.SOL components, hooks, flows, and templates.",
  alternates: { canonical: "/registry" },
};

export default function RegistryPage() {
  return (
    <div className="px-4 pb-16 pt-8 sm:px-8 lg:pt-12">
      <div className="mx-auto max-w-300 space-y-12">
        <section className="max-w-180 pt-2">
          <h1
            className="mb-4 text-balance text-[34px] font-semibold leading-[1.08] tracking-normal sm:text-[48px]"
            style={{ color: "var(--text-primary)" }}
          >
            UX.SOL registry
          </h1>
          <p
            className="max-w-155 text-pretty text-base leading-7 sm:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Search current registry items. Open any item to view its docs,
            usage, and install command.
          </p>
        </section>

        <DocsHomeExplorer />
      </div>
    </div>
  );
}
