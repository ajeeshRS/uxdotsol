export default function RegistryDocsPage() {
  return (
    <div className="max-w-5xl space-y-10 pb-16">
      <div className="space-y-4">
        <p className="text-eyebrow">Setup</p>
        <h1
          className="scroll-m-20 text-5xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Registry
        </h1>
        <p
          className="max-w-[640px] text-lg leading-8"
          style={{ color: "var(--text-secondary)" }}
        >
          UX.SOL uses the standard shadcn registry flow. No separate CLI is
          required.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Choose an item", "Search or browse the docs registry."],
          ["2", "Copy install", "Use the registry JSON URL for that block."],
          ["3", "Own the code", "The component lands in your codebase."],
        ].map(([step, title, body]) => (
          <div
            key={step}
            className="rounded-[30px] border border-[#f4f4f4] bg-white p-5 transition duration-300 hover:border-[#eaeaea] dark:border-[#141414] dark:bg-neutral-950 dark:hover:border-[#1c1c1c]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] text-sm font-semibold text-neutral-950 dark:bg-black dark:text-white">
              {step}
            </span>
            <h2
              className="mt-4 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {body}
            </p>
          </div>
        ))}
      </div>

      <section
        className="rounded-[30px] border border-[#f4f4f4] bg-white p-5 dark:border-[#141414] dark:bg-neutral-950 sm:p-6"
      >
        <div className="max-w-2xl">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Configuration
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            Keep your existing shadcn aliases in <code>components.json</code>.
            UX.SOL registry items resolve against the same paths.
          </p>
        </div>

        <div
          className="mt-6 overflow-x-auto rounded-[22px] bg-[color-mix(in_srgb,var(--surface-secondary)_72%,white)] p-4 font-mono text-sm text-neutral-800 dark:bg-black dark:text-neutral-50"
        >
          <pre>
{`{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
