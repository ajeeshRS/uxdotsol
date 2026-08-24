<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UX.SOL Project Context

## Product Model

- UX.SOL is an open-source, shadcn-compatible source registry for Solana product experiences.
- Consumers install readable source files into their own application; UX.SOL is not a required runtime SDK.
- The registry contains components, hooks, multi-step flows, templates, and selected Next.js API routes.
- Public site: `https://uxdotsol.xyz`; source repository: `https://github.com/ajeeshRS/uxdotsol`.

## Sources of Truth

- `registry.json`: item manifest, dependencies, environment variables, files, and install relationships.
- `registry/uxdotsol/`: authored registry source.
- `lib/docs/`: documentation metadata, examples, anatomy, states, and API reference content; `lib/docs.ts` is the stable entry point.
- `public/r/`: generated shadcn registry output. Never edit these files manually.
- `app/api/`: server adapters and routes included by registry items where required.

When registry source or metadata changes, update the relevant docs and regenerate `public/r/` with `pnpm registry:build`.

## Product Invariants

- Never fabricate wallet, RPC, price, token-safety, payment, or transaction results.
- Transaction success must come from authoritative wallet, RPC, indexer, or server evidence.
- Payment completion must come from server-side reconciliation, not browser focus or elapsed time.
- Token and recipient safety signals are informational and must preserve unknown/error states.
- Wallet actions require explicit user approval. Examples that submit transactions use devnet unless clearly documented otherwise.
- Keep provider credentials server-side and document every required environment variable in `registry.json`.
- Preserve keyboard access, focus visibility, semantic controls, and reduced-motion behavior in shipped UI.

## Commands

- Install: `pnpm install`
- Development: `pnpm dev`
- Lint: `pnpm lint`
- Tests: `pnpm test`
- Production build: `pnpm build`
- Generate registry output: `pnpm registry:build`

Do not run build, development, or visual-check commands unless the user explicitly requests them.

### Editing Rules

- Do not delete and recreate existing files unless explicitly requested.
- Prefer minimal in-place edits with `apply_patch`.
- Preserve file history and local structure.
- For large rewrites, ask before replacing a whole file.
- Never use `Delete File` + `Add File` as a normal editing strategy.

### Run command Rules
- Do not run build/run commands unless explicitly requested.
- Do not run visual checks
