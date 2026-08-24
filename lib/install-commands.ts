export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];
export type PackageManagerCommands = Record<PackageManager, string>;

const PACKAGE_RUNNERS: Record<PackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx",
};

export function createRegistryInstallCommands(
  slug: string,
): PackageManagerCommands {
  const command = `shadcn@latest add https://uxdotsol.xyz/r/${slug}.json`;

  return Object.fromEntries(
    PACKAGE_MANAGERS.map((manager) => [
      manager,
      `${PACKAGE_RUNNERS[manager]} ${command}`,
    ]),
  ) as PackageManagerCommands;
}
