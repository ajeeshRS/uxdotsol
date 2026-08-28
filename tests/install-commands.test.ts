import { describe, expect, it } from "vitest";

import {
  createPackageInstallCommands,
  createRegistryInstallCommands,
  createShadcnAddCommands,
} from "@/lib/install-commands";

describe("install commands", () => {
  it("uses the selected package manager to install dependencies", () => {
    expect(createPackageInstallCommands(["foo", "bar"])).toEqual({
      npm: "npm install foo bar",
      pnpm: "pnpm add foo bar",
      yarn: "yarn add foo bar",
      bun: "bun add foo bar",
    });
  });

  it("uses the selected package runner for shadcn items", () => {
    expect(createShadcnAddCommands(["button", "dialog"])).toEqual({
      npm: "npx shadcn@latest add button dialog",
      pnpm: "pnpm dlx shadcn@latest add button dialog",
      yarn: "yarn dlx shadcn@latest add button dialog",
      bun: "bunx shadcn@latest add button dialog",
    });
  });

  it("creates registry URL commands for every package manager", () => {
    expect(createRegistryInstallCommands("connect-wallet-btn")).toEqual({
      npm: "npx shadcn@latest add https://uxdotsol.xyz/r/connect-wallet-btn.json",
      pnpm:
        "pnpm dlx shadcn@latest add https://uxdotsol.xyz/r/connect-wallet-btn.json",
      yarn:
        "yarn dlx shadcn@latest add https://uxdotsol.xyz/r/connect-wallet-btn.json",
      bun: "bunx shadcn@latest add https://uxdotsol.xyz/r/connect-wallet-btn.json",
    });
  });
});
