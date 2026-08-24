import type { Metadata } from "next";
import { DocsLayoutFrame } from "@/app/docs/_components/docs-layout-frame";

export const metadata: Metadata = {
  title: "Documentation | UX.SOL",
  description:
    "Install and use UX.SOL components, hooks, flows, and templates.",
  alternates: { canonical: "/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="divider-fade-bottom">
      <DocsLayoutFrame>{children}</DocsLayoutFrame>
    </div>
  );
}
