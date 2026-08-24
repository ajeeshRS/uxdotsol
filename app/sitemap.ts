import type { MetadataRoute } from "next";

import registry from "@/registry.json";

const siteUrl = "https://uxdotsol.xyz";

function getDocsPath(item: (typeof registry.items)[number]) {
  const sourcePath = item.files[0]?.path ?? "";

  if (sourcePath.includes("/hooks/")) return `/docs/hooks/${item.name}`;
  if (sourcePath.includes("/flows/")) return `/docs/flows/${item.name}`;
  if (sourcePath.includes("/templates/")) return `/docs/templates/${item.name}`;
  return `/docs/components/${item.name}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/docs`, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${siteUrl}/docs/installation`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/registry`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/docs/registry`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const documentationRoutes: MetadataRoute.Sitemap = registry.items.map(
    (item) => ({
      url: `${siteUrl}${getDocsPath(item)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  return [...staticRoutes, ...documentationRoutes];
}
