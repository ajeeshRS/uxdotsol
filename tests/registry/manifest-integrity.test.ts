// @vitest-environment node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type RegistryFile = { path: string; target?: string; type: string };
type RegistryItem = {
  name: string;
  files: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
};

async function loadRegistry() {
  return JSON.parse(await readFile(resolve("registry.json"), "utf8")) as {
    items: RegistryItem[];
  };
}

describe("registry manifest integrity", () => {
  it("has unique item names", async () => {
    const { items } = await loadRegistry();
    const names = items.map((item) => item.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("references source files that exist and are non-empty", async () => {
    const { items } = await loadRegistry();

    for (const item of items) {
      expect(item.files.length, `${item.name} has no files`).toBeGreaterThan(0);
      for (const file of item.files) {
        const source = await readFile(resolve(file.path), "utf8");
        expect(source.trim().length, `${item.name}: ${file.path}`).toBeGreaterThan(0);
      }
    }
  });

  it("does not duplicate package or registry dependencies per item", async () => {
    const { items } = await loadRegistry();

    for (const item of items) {
      const dependencies = item.dependencies ?? [];
      const registryDependencies = item.registryDependencies ?? [];
      expect(new Set(dependencies).size, item.name).toBe(dependencies.length);
      expect(new Set(registryDependencies).size, item.name).toBe(
        registryDependencies.length,
      );
    }
  });
});
