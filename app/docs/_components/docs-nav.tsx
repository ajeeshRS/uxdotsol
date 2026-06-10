"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { docComponents } from "@/lib/docs";

const hookGroups: Record<string, string> = {
  "use-smart-retry": "Hooks",
  "use-optimistic-transaction": "Hooks",
  "use-token-balance": "Hooks",
  "use-transaction-simulation": "Hooks",
  "use-transaction-status": "Hooks",
  "use-private-payment": "API hooks",
};

const categoryRoutes: Record<string, string> = {
  Hooks: "hooks",
  "API hooks": "hooks",
};

type DocComponent = (typeof docComponents)[number];

export function DocsSidebarNav() {
  const pathname = usePathname();

  const getCategory = (item: DocComponent) => {
    const path = item.files?.[0]?.path || "";
    if (item.type === "registry:hook") return hookGroups[item.name] || "Hooks";
    if (path.includes("flows")) return "Flows";
    if (path.includes("templates")) return "Templates";
    return "Components";
  };

  const categories = [
    "Components",
    "Hooks",
    "API hooks",
    "Flows",
    "Templates",
  ];
  const groupedDocs = categories.map((cat) => ({
    title: cat,
    items: docComponents.flatMap((doc) =>
      getCategory(doc) === cat
        ? [
            {
              title: doc.title,
              href: `/docs/${categoryRoutes[cat] || cat.toLowerCase()}/${doc.name}`,
            },
          ]
        : [],
    ),
  }));

  const navItems = [
    {
      title: "Getting Started",
      items: [
        { title: "Introduction", href: "/docs" },
        { title: "Installation", href: "/docs/installation" },
      ],
    },
    ...groupedDocs,
  ];

  return (
    <div className="w-full space-y-5">
      <div className="p-2">
        <Link
          href="/registry"
          className="flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-black"
          style={{ color: "var(--text-secondary)" }}
        >
          Browse registry
        </Link>
      </div>

      {navItems.map((group, index) => (
        <div
          key={index}
          className="p-2"
        >
          <h4
            className="mb-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            {group.title}
          </h4>
          <div className="grid grid-flow-row auto-rows-max gap-1">
            {group.items.map((item, itemIndex) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={itemIndex}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "font-medium" : "hover:text-[var(--text-primary)]",
                  )}
                  style={{
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    background: isActive
                      ? "var(--surface-secondary)"
                      : "transparent",
                  }}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const sidebarNavItems = [];
