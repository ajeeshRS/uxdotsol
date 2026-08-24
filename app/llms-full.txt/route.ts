import registry from "@/registry.json";

export const dynamic = "force-static";

const siteUrl = "https://uxdotsol.xyz";
const categories = ["components", "hooks", "flows", "templates"] as const;

type Category = (typeof categories)[number];
type RegistryItem = (typeof registry.items)[number];

function getCategory(item: RegistryItem): Category {
  const sourcePath = item.files[0]?.path ?? "";

  if (sourcePath.includes("/hooks/")) return "hooks";
  if (sourcePath.includes("/flows/")) return "flows";
  if (sourcePath.includes("/templates/")) return "templates";
  return "components";
}

function getDocsUrl(item: RegistryItem) {
  return `${siteUrl}/docs/${getCategory(item)}/${item.name}`;
}

function getInstallUrl(item: RegistryItem) {
  return `${siteUrl}/r/${item.name}.json`;
}

function getRegistryDependencies(item: RegistryItem) {
  return "registryDependencies" in item
    ? (item.registryDependencies ?? [])
    : [];
}

function getEnvironmentVariables(item: RegistryItem) {
  return "envVars" in item && item.envVars
    ? Object.entries(item.envVars)
    : [];
}

function getImplementationNotes(item: RegistryItem) {
  return "docs" in item ? item.docs : null;
}

function formatItem(item: RegistryItem) {
  const registryDependencies = getRegistryDependencies(item);
  const environmentVariables = getEnvironmentVariables(item);
  const implementationNotes = getImplementationNotes(item);

  return [
    `### ${item.title} (\`${item.name}\`)`,
    "",
    item.description,
    "",
    `- Documentation: ${getDocsUrl(item)}`,
    `- Install: \`pnpm dlx shadcn@latest add ${getInstallUrl(item)}\``,
    `- Registry JSON: ${getInstallUrl(item)}`,
    `- npm dependencies: ${item.dependencies.length ? item.dependencies.map((dependency) => `\`${dependency}\``).join(", ") : "none"}`,
    `- UX.SOL dependencies: ${registryDependencies.length ? registryDependencies.join(", ") : "none"}`,
    `- Environment variables: ${environmentVariables.length ? environmentVariables.map(([name, defaultValue]) => `\`${name}${defaultValue ? `=${defaultValue}` : ""}\``).join(", ") : "none"}`,
    `- Installed files: ${item.files.map((file) => `\`${file.target}\``).join(", ")}`,
    ...(implementationNotes
      ? ["", `Implementation notes: ${implementationNotes}`]
      : []),
    "",
  ];
}

function buildAgentReference() {
  const sections = categories.flatMap((category) => {
    const items = registry.items.filter((item) => getCategory(item) === category);

    return [
      `## ${category[0].toUpperCase()}${category.slice(1)}`,
      "",
      ...items.flatMap(formatItem),
      "",
    ];
  });

  return [
    "# UX.SOL Complete Registry Reference",
    "",
    "> UX.SOL is an open-source, shadcn-compatible source registry for Solana UI, interaction logic, flows, and templates.",
    "",
    "Install one item with `pnpm dlx shadcn@latest add https://uxdotsol.xyz/r/<item-name>.json`. Installed files become part of the consumer application; there is no required UX.SOL runtime package.",
    "",
    `This reference is generated from registry.json and currently covers ${registry.items.length} items. Use it for exact install URLs, dependencies, environment variables, installed file targets, and implementation notes.`,
    "",
    "Important: registry previews preserve real provider, wallet, RPC, loading, unknown, and error states. They do not fabricate transaction or payment success. Integrators remain responsible for provider configuration, transaction simulation, explicit wallet approval, and authoritative server-side reconciliation.",
    "",
    ...sections,
    "## Machine-readable Sources",
    "",
    `- [Registry manifest](${siteUrl}/r/registry.json): Files, dependencies, environment variables, and registry relationships.`,
    "- [Source repository](https://github.com/ajeeshRS/uxdotsol): Authored source, tests, documentation, and project history.",
    "- [License](https://github.com/ajeeshRS/uxdotsol/blob/main/LICENSE): MIT license terms.",
    "",
  ].join("\n");
}

export function GET() {
  return new Response(buildAgentReference(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      Link: '</llms.txt>; rel="describedby"; type="text/markdown"',
    },
  });
}
