import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docComponents, getDocComponent } from "@/lib/docs";
import { DocsPageShell } from "@/app/docs/_components/docs-page-shell";

export async function generateStaticParams() {
  return docComponents.flatMap((item) =>
    item.files?.[0]?.path.includes("/flows/")
      ? [{ slug: item.name }]
      : [],
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getDocComponent(slug);

  return doc
    ? { title: `${doc.title} | UX.SOL`, description: doc.description }
    : {};
}

export default async function FlowPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const doc = getDocComponent(params.slug);

  if (!doc) {
    notFound();
  }

  return <DocsPageShell slug={params.slug} doc={doc} />;
}
