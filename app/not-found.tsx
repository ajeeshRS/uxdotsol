import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] w-full max-w-3xl flex-col items-start justify-center px-5 py-24 sm:px-8">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        This page is not in the registry.
      </h1>
      <p className="mt-5 max-w-xl text-pretty leading-7 text-muted-foreground">
        The link may be outdated, or the item may have moved. Browse the
        registry or return home.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/registry"
          className="inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Browse registry
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
