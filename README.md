# UX.SOL

Open-source, shadcn-compatible components, hooks, flows, and templates for
building Solana product experiences.

UX.SOL distributes source code through the shadcn registry format. Installed
items live in the consumer application and can be inspected, adapted, and
maintained without a required UX.SOL runtime dependency.

## Repository

This repository contains:

- The public UX.SOL documentation and registry browser.
- Source files for all registry items.
- Generated shadcn registry JSON files.
- Example Next.js API routes used by selected components.
- Documentation metadata, previews, and installation examples.

## Agent and Machine-readable Context

- [`AGENTS.md`](AGENTS.md) defines the architecture, source-of-truth files, commands, and product safety invariants for coding agents.
- [`public/llms.txt`](public/llms.txt) is the concise website guide served at `https://uxdotsol.xyz/llms.txt`.
- `https://uxdotsol.xyz/llms-full.txt` is generated from `registry.json` and lists every current registry item for retrieval agents.
- `https://uxdotsol.xyz/sitemap.xml` lists the indexable documentation routes; `robots.txt` keeps server API routes out of crawler traffic.

## Tech Stack

| Area | Technology |
|---|---|
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Registry | shadcn registry format |
| Solana | `@solana/web3.js`, Wallet Adapter |
| Package manager | pnpm |

## Prerequisites

- Node.js `24.19.0` LTS or newer within the Node.js 24 release line
- pnpm `10` or newer
- Integration-specific credentials only for the previews you use

## Local Setup

```bash
git clone https://github.com/ajeeshRS/uxdotsol.git
cd uxdotsol
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill only the integrations you plan to use. Local development can run without
optional provider credentials; affected previews will display configuration errors.

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment files are ignored by Git. Do not commit API keys or private RPC
credentials.

## Live Preview Policy

- Wallet and transaction previews use Solana devnet and submit only after explicit wallet approval.
- Simulation, balances, recipients, blockhashes, and transaction status come from real RPC calls.
- Token safety and price previews call their bundled server routes; missing credentials remain visible errors.
- Private payment previews call the configured MagicBlock service and surface its real availability and validation responses.
- The status badge reads the official Solana Statuspage API.
- No preview fabricates signatures, delayed success, API responses, or confirmation states.

Real devnet sends still consume network fees. Use a funded development wallet and verify the cluster before approving any request.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `COINGECKO_API_KEY` | For price data | CoinGecko Demo or Pro API key used by `/api/coin-price` |
| `COINGECKO_API_PLAN` | No | Use `demo` by default or `pro` for a Pro key |
| `JUPITER_API_KEY` | For token safety | Jupiter API key used server-side by `/api/token-safety` |
| `MAINNET_RPC` | No | Overrides the public Solana mainnet RPC |
| `DEVNET_RPC` | No | Overrides the public Solana devnet RPC |
| `SOLANA_AUTH_SECRET` | Production SIWS | Signs authentication challenge and session cookies; development generates an ephemeral secret |
| `SOLANA_AUTH_ORIGIN` | Production SIWS | Canonical application origin used for domain binding |
| `SOLANA_AUTH_CHAIN_ID` | No | SIWS chain identifier; defaults to `mainnet` |
| `SOLANA_AUTH_STATEMENT` | No | Custom human-readable wallet sign-in statement |

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run the Vitest suite |
| `pnpm registry:build` | Generate registry JSON files in `public/r` |

## Registry Usage

Install an item directly into a shadcn-compatible project:

```bash
pnpm dlx shadcn@latest add https://uxdotsol.xyz/r/address-display.json
```

Replace `address-display` with an item name from `registry.json`.

Registry files install into namespaced folders while respecting the consumer's
configured shadcn aliases:

```text
components/uxdotsol/components/   # Reusable components
components/uxdotsol/flows/        # Multi-step flows
components/uxdotsol/templates/    # Complete page templates
hooks/uxdotsol/                   # Hooks and shared hook utilities
app/api/                          # Required Next.js API routes
```

Installing a flow or template also installs its declared component and hook
dependencies into the matching folders.

## Registry Development

1. Add or update source code under `registry/uxdotsol/`.
2. Define the item, files, dependencies, and environment variables in
   `registry.json`.
3. Add or update its documentation in `lib/docs.ts`.
4. Generate distributable registry files:

```bash
pnpm registry:build
```

5. Review the generated files under `public/r/`.
6. Run lint and a production build before submitting changes.

`registry.json` and `registry/uxdotsol/` are the source of truth. Files under
`public/r/` are generated output and should not be edited manually.

## Project Structure

| Path | Purpose |
|---|---|
| `app/` | Next.js routes, documentation pages, and API routes |
| `components/` | Site layout, providers, and shared components |
| `lib/docs/` | Registry documentation, examples, and metadata |
| `registry/uxdotsol/` | Registry item source code |
| `registry.json` | Registry manifest and dependency definitions |
| `public/r/` | Generated installable registry JSON |
| `public/previews/` | Documentation preview assets |
| `components.json` | Local shadcn configuration |

## API Routes

| Route | Purpose |
|---|---|
| `/api/coin-price` | Fetches CoinGecko market and chart data |
| `/api/payment-quote` | Normalizes Jupiter token conversion quotes |
| `/api/payment-status` | Verifies a payment signature through Solana RPC |
| `/api/priority-fee-estimate` | Reads recent Solana prioritization-fee samples |
| `/api/token-list` | Searches Jupiter token metadata through a server adapter |
| `/api/token-metadata` | Loads normalized metadata for one token mint |
| `/api/token-safety` | Normalizes Jupiter token metadata into safety signals |
| `/api/transaction-history` | Loads recent signatures for a Solana address |
| `/api/wallet-account` | Reads Solana account existence and SOL balance |
| `/api/auth/solana` | Creates and verifies SIWS challenges and manages wallet sessions |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the complete development workflow
and registry-item checklist.

- Keep changes scoped to the relevant registry item or documentation area.
- Follow the existing TypeScript and component conventions.
- Declare every runtime dependency in `registry.json`.
- Include all required files, registry dependencies, and environment variables.
- Regenerate `public/r/` when registry source or metadata changes.
- Never include secrets, private keys, or production credentials.

## License

Released under the [MIT License](LICENSE).
