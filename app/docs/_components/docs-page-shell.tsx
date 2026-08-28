"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DocsTabs } from "@/app/docs/_components/docs-tabs";
import {
  CliInstallation,
  ManualInstallation,
  type RegistryItemInstallData,
} from "@/app/docs/_components/registry-item-details";
import TerminalCodeBlock from "@/app/docs/_components/terminal-code-block";
import type { PropDoc } from "@/lib/docs";
import { EASE_OUT } from "@/lib/motion";

const ComponentPreview = dynamic(() =>
  import("@/app/docs/_components/component-preview").then(
    (module) => module.ComponentPreview,
  ),
);

const INSTALL_TABS = ["cli", "manual"] as const;

type DocsPageShellDoc = RegistryItemInstallData & {
  title: string;
  type?: string;
  description?: string;
  usage?: string | string[];
  props?: PropDoc[];
  functions?: PropDoc[];
  types?: PropDoc[];
  returns?: PropDoc[];
};

export function DocsPageShell({
  slug,
  doc,
  previewFullscreen = false,
}: {
  slug: string;
  doc: DocsPageShellDoc;
  previewFullscreen?: boolean;
}) {
  const isHook = doc.type === "registry:hook";
  const reduceMotion = useReducedMotion();
  const [installTab, setInstallTab] = useUrlTab(
    "install",
    "cli",
    INSTALL_TABS,
  );
  const sections = useMemo(
    () =>
      [
        !isHook ? "Preview" : null,
        "Installation",
        "Usage",
        doc.props && doc.props.length > 0
          ? isHook
            ? "Options"
            : "Props / Arguments"
          : null,
        doc.functions && doc.functions.length > 0 ? "Functions" : null,
        doc.types && doc.types.length > 0 ? "Types" : null,
        doc.returns && doc.returns.length > 0 ? "Returns" : null,
      ].filter(Boolean) as string[],
    [doc.functions, doc.props, doc.returns, doc.types, isHook],
  );
  const sectionItems = useMemo(
    () =>
      sections.map((section) => ({
        title: section,
        id: getSectionId(section),
      })),
    [sections],
  );
  const [activeSection, setActiveSection] = useState(sectionItems[0]?.id);

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
        <div className="space-y-4">
          <p className="text-eyebrow">{isHook ? "Hook" : "Component"}</p>
          <h1
            className="scroll-m-20 text-balance text-[42px] font-semibold leading-tight tracking-normal sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            {doc.title}
          </h1>
          <p
            className="max-w-[680px] text-pretty text-lg leading-8"
            style={{ color: "var(--text-secondary)" }}
          >
            {doc.description}
          </p>
        </div>

      {!isHook ? (
        <section id="preview" className="scroll-m-24 space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Preview
          </h2>
          <ComponentPreview
            slug={slug}
            allowFullscreen={previewFullscreen}
          />
        </section>
      ) : null}

      <section id="installation" className="scroll-m-24 space-y-4">
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Installation
        </h2>
        <DocsTabs
          label="Installation method"
          value={installTab}
          onValueChange={setInstallTab}
          options={[
            {
              value: "cli",
              label: "CLI",
              panelId: "cli-installation-panel",
            },
            {
              value: "manual",
              label: "Manual",
              panelId: "manual-installation-panel",
            },
          ]}
        />
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={installTab}
            id={`${installTab}-installation-panel`}
            role="tabpanel"
            aria-labelledby={`${installTab}-installation-panel-tab`}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    transform:
                      installTab === "manual"
                        ? "translateX(6px)"
                        : "translateX(-6px)",
                  }
            }
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{
              opacity: 0,
              transition: {
                duration: reduceMotion ? 0 : 0.1,
                ease: EASE_OUT,
              },
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.18, ease: EASE_OUT }
            }
          >
            {installTab === "cli" ? (
              <CliInstallation slug={slug} />
            ) : (
              <ManualInstallation slug={slug} item={doc} />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <section id="usage" className="scroll-m-24 space-y-4">
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Usage
        </h2>
        {Array.isArray(doc.usage) ? (
          doc.usage.map((snippet: string, idx: number) => {
            let label = "usage";
            if (
              slug === "connect-wallet-btn" ||
              slug === "sign-in-with-solana" ||
              slug === "coin-price" ||
              slug === "use-token-safety"
            ) {
              label = ["usage", ".env.local"][idx] || "usage";
            }
            return (
              <TerminalCodeBlock
                key={idx}
                code={snippet}
                label={label.toLowerCase()}
              />
            );
          })
        ) : (
          <TerminalCodeBlock
            code={doc.usage || ""}
            label={`${slug}.tsx`.toLowerCase()}
          />
        )}
      </section>

      {doc.props && doc.props.length > 0 && (
        <DocTable title={isHook ? "Options" : "Props / Arguments"} rows={doc.props} />
      )}

      {doc.functions && doc.functions.length > 0 && (
        <DocTable title="Functions" rows={doc.functions} />
      )}

      {doc.types && doc.types.length > 0 && (
        <DocTable title="Types" rows={doc.types} />
      )}

      {doc.returns && doc.returns.length > 0 && (
        <DocTable title="Returns" rows={doc.returns} />
      )}
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

function DocTable({ title, rows }: { title: string; rows: PropDoc[] }) {
  const id = getSectionId(title);

  return (
    <section id={id} className="scroll-m-24 space-y-4">
      <h2
        className="text-2xl font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <div
        className="w-full overflow-x-auto rounded-[30px] border border-[#f4f4f4] bg-white dark:border-[#141414] dark:bg-neutral-950"
      >
        <table className="table-fade-rows w-full text-sm text-left">
          <thead className="bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] text-neutral-500 dark:bg-black dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Default</th>
              <th className="px-6 py-4 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td
                  className="px-6 py-4 font-mono text-xs font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.name}
                </td>
                <td
                  className="px-6 py-4 font-mono text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {row.type}
                </td>
                <td
                  className="px-6 py-4 font-mono text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {row.defaultValue}
                </td>
                <td
                  className="px-6 py-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getSectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function useUrlTab<T extends string>(
  parameter: string,
  defaultValue: T,
  values: readonly T[],
) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const syncFromUrl = () => {
      const nextValue = new URL(window.location.href).searchParams.get(parameter);
      setValue(
        nextValue && values.includes(nextValue as T)
          ? (nextValue as T)
          : defaultValue,
      );
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [defaultValue, parameter, values]);

  const updateValue = (nextValue: T) => {
    setValue(nextValue);

    const url = new URL(window.location.href);
    if (nextValue === defaultValue) {
      url.searchParams.delete(parameter);
    } else {
      url.searchParams.set(parameter, nextValue);
    }
    window.history.replaceState(window.history.state, "", url);
  };

  return [value, updateValue] as const;
}
