export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];
export type PackageManagerCommands = Record<PackageManager, string>;

const PACKAGE_RUNNERS: Record<PackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx",
};

const PACKAGE_INSTALLERS: Record<PackageManager, string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
  bun: "bun add",
};

function createCommands(
  command: (manager: PackageManager) => string,
): PackageManagerCommands {
  return Object.fromEntries(
    PACKAGE_MANAGERS.map((manager) => [manager, command(manager)]),
  ) as PackageManagerCommands;
}

export function createPackageInstallCommands(
  dependencies: readonly string[],
): PackageManagerCommands {
  const packages = dependencies.join(" ");
  return createCommands(
    (manager) => `${PACKAGE_INSTALLERS[manager]} ${packages}`,
  );
}

export function createShadcnAddCommands(
  items: readonly string[],
): PackageManagerCommands {
  const targets = items.join(" ");
  return createCommands(
    (manager) => `${PACKAGE_RUNNERS[manager]} shadcn@latest add ${targets}`,
  );
}

export function createRegistryInstallCommands(
  slug: string,
): PackageManagerCommands {
  return createShadcnAddCommands([
    `https://uxdotsol.xyz/r/${slug}.json`,
  ]);
}
