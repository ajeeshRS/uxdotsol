import registry from "@/registry.json";

import { componentDocs } from "./docs/components";
import { flowDocs } from "./docs/flows";
import { hookDocs } from "./docs/hooks";
import { templateDocs } from "./docs/templates";
import type { ComponentDocMeta } from "./docs/types";

export type { ComponentDocMeta, PropDoc } from "./docs/types";

export const componentMeta: Record<string, ComponentDocMeta> = {
  ...componentDocs,
  ...hookDocs,
  ...flowDocs,
  ...templateDocs,
};

export const docComponents = registry.items.map((item) => ({
  ...item,
  meta: componentMeta[item.name],
}));

export const registryHomepage = registry.homepage;

export function getDocComponent(slug: string) {
  return docComponents.find((component) => component.name === slug);
}
