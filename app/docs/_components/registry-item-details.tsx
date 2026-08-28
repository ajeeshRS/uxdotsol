"use client";

import { type ReactNode, useEffect, useState } from "react";

import TerminalCodeBlock from "@/app/docs/_components/terminal-code-block";
import {
  createPackageInstallCommands,
  createRegistryInstallCommands,
  createShadcnAddCommands,
} from "@/lib/install-commands";

type RegistryFile = {
  path: string;
  target?: string;
  content?: string;
};

export type RegistryItemInstallData = {
  dependencies?: string[];
  registryDependencies?: string[];
  envVars?: Record<string, string | undefined>;
  docs?: string;
  files?: RegistryFile[];
};

type PublishedRegistryItem = RegistryItemInstallData & {
  name: string;
};

type ResolvedInstallation = {
  slug: string;
  dependencies: string[];
  envVars: Record<string, string | undefined>;
  files: RegistryFile[];
  registryItems: string[];
};

function useResolvedInstallation(slug: string) {
  const [installation, setInstallation] = useState<ResolvedInstallation | null>(
    null,
  );
  const [errorSlug, setErrorSlug] = useState<string | null>(null);
  const resolved = installation?.slug === slug ? installation : null;
  const error = errorSlug === slug;

  useEffect(() => {
    if (resolved) return;

    const controller = new AbortController();

    async function loadInstallation() {
      try {
        setErrorSlug(null);
        setInstallation(
          await resolveRegistryInstallation(slug, controller.signal),
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setErrorSlug(slug);
      }
    }

    void loadInstallation();
    return () => controller.abort();
  }, [resolved, slug]);

  return { installation: resolved, error };
}

export function CliInstallation({ slug }: { slug: string }) {
  return (
    <TerminalCodeBlock
      code={`npx shadcn@latest add https://uxdotsol.xyz/r/${slug}.json`}
      packageManagerCommands={createRegistryInstallCommands(slug)}
      label="terminal"
    />
  );
}

export function ManualInstallation({
  slug,
  item,
}: {
  slug: string;
  item: RegistryItemInstallData;
}) {
  const { installation, error } = useResolvedInstallation(slug);

  if (!installation && !error) {
    return (
      <div
        className="flex min-h-40 items-center justify-center rounded-2xl border border-[#f4f4f4] text-sm text-neutral-400 dark:border-[#141414] dark:text-neutral-600"
        aria-live="polite"
      >
        Preparing manual installation…
      </div>
    );
  }

  if (error || !installation) {
    return (
      <p
        className="rounded-2xl border border-dashed border-[#eaeaea] p-5 text-sm text-neutral-500 dark:border-[#1c1c1c] dark:text-neutral-400"
        role="alert"
      >
        Manual installation could not load all required source files. Try again
        or use the CLI installation.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {item.docs ? (
        <p className="rounded-2xl border border-[#f4f4f4] bg-white px-5 py-4 text-sm leading-6 text-neutral-500 dark:border-[#141414] dark:bg-neutral-950 dark:text-neutral-400">
          {item.docs}
        </p>
      ) : null}

      {installation.dependencies.length ? (
        <ManualSection title="Install Dependencies">
          <TerminalCodeBlock
            code={`npm install ${installation.dependencies.join(" ")}`}
            packageManagerCommands={createPackageInstallCommands(
              installation.dependencies,
            )}
            label="terminal"
          />
        </ManualSection>
      ) : null}

      {installation.registryItems.length ? (
        <ManualSection title="Install Registry Primitives">
          <TerminalCodeBlock
            code={`npx shadcn@latest add ${installation.registryItems.join(" ")}`}
            packageManagerCommands={createShadcnAddCommands(
              installation.registryItems,
            )}
            label="terminal"
          />
        </ManualSection>
      ) : null}

      {Object.keys(installation.envVars).length > 0 ? (
        <ManualSection title="Configure Environment Variables">
          <TerminalCodeBlock
            code={Object.entries(installation.envVars)
              .map(
                ([name, value]) =>
                  `${name}=${getManualEnvValue(name, value)}`,
              )
              .join("\n")}
            label=".env.local"
          />
        </ManualSection>
      ) : null}

      <ManualSection title="Copy Source Files">
        {installation.files.map((file) => (
          <TerminalCodeBlock
            key={file.path}
            code={file.content ?? ""}
            label={(file.target ?? file.path).toLowerCase()}
            collapsible
          />
        ))}
      </ManualSection>
    </div>
  );
}

async function resolveRegistryInstallation(
  rootSlug: string,
  signal: AbortSignal,
): Promise<ResolvedInstallation> {
  const itemCache = new Map<string, Promise<PublishedRegistryItem>>();

  const loadItem = (slug: string) => {
    const cached = itemCache.get(slug);
    if (cached) return cached;

    const request = fetch(`/r/${encodeURIComponent(slug)}.json`, { signal }).then(
      async (response) => {
        if (!response.ok) {
          throw new Error(`Registry item ${slug} is unavailable`);
        }
        return (await response.json()) as PublishedRegistryItem;
      },
    );
    itemCache.set(slug, request);
    return request;
  };

  const visit = async (
    slug: string,
    ancestors: ReadonlySet<string>,
  ): Promise<PublishedRegistryItem[]> => {
    if (ancestors.has(slug)) return [];

    const registryItem = await loadItem(slug);
    const nextAncestors = new Set(ancestors).add(slug);
    const dependencySlugs = (registryItem.registryDependencies ?? [])
      .map(getUxSolRegistrySlug)
      .filter((dependency): dependency is string => Boolean(dependency));
    const dependencyTrees = await Promise.all(
      dependencySlugs.map((dependency) => visit(dependency, nextAncestors)),
    );

    return [...dependencyTrees.flat(), registryItem];
  };

  const registryTree = await visit(rootSlug, new Set());
  const uniqueItems = new Map<string, PublishedRegistryItem>();
  registryTree.forEach((registryItem) => {
    uniqueItems.set(registryItem.name, registryItem);
  });

  const dependencies = new Set<string>();
  const envVars: Record<string, string | undefined> = {};
  const files = new Map<string, RegistryFile>();
  const registryItems = new Set<string>();

  uniqueItems.forEach((registryItem) => {
    registryItem.dependencies?.forEach((dependency) =>
      dependencies.add(dependency),
    );
    Object.assign(envVars, registryItem.envVars);
    registryItem.files?.forEach((file) => {
      if (file.content) files.set(file.target ?? file.path, file);
    });
    registryItem.registryDependencies?.forEach((dependency) => {
      if (!getUxSolRegistrySlug(dependency)) {
        registryItems.add(getRegistryItemName(dependency));
      }
    });
  });

  return {
    slug: rootSlug,
    dependencies: [...dependencies],
    envVars,
    files: [...files.values()],
    registryItems: [...registryItems],
  };
}

function getUxSolRegistrySlug(dependency: string) {
  if (!dependency.includes("uxdotsol.xyz/r/")) return null;
  return getRegistryItemName(dependency);
}

function getRegistryItemName(dependency: string) {
  const lastSegment = dependency.split("/").at(-1) ?? dependency;
  return lastSegment.replace(/\.json$/, "");
}

function getManualEnvValue(name: string, value?: string) {
  if (value) return value;
  return name.endsWith("_RPC") ? `YOUR_${name}_URL` : `YOUR_${name}`;
}

function ManualSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
