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

## Tech Stack

| Area | Technology |
|---|---|
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Registry | shadcn registry format |
| Solana | `@solana/web3.js`, Wallet Adapter |
| Package manager | pnpm |

## Prerequisites

- Node.js `20.9.0` or newer
- pnpm `10` or newer
- A CoinGecko API key for live coin-price data

## Local Setup

```bash
git clone https://github.com/ajeeshRS/uxdotsol.git
cd uxdotsol
pnpm install
```

Create `.env.local`:

```bash
COINGECKO_API_KEY=your_api_key
COINGECKO_API_PLAN=demo

# Optional RPC overrides
MAINNET_RPC=https://your-mainnet-rpc.example
DEVNET_RPC=https://your-devnet-rpc.example
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment files are ignored by Git. Do not commit API keys or private RPC
credentials.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `COINGECKO_API_KEY` | For price data | CoinGecko Demo or Pro API key used by `/api/coin-price` |
| `COINGECKO_API_PLAN` | No | Use `demo` by default or `pro` for a Pro key |
| `MAINNET_RPC` | No | Overrides the public Solana mainnet RPC |
| `DEVNET_RPC` | No | Overrides the public Solana devnet RPC |

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm registry:build` | Generate registry JSON files in `public/r` |

## Registry Usage

Install an item directly into a shadcn-compatible project:

```bash
pnpm dlx shadcn@latest add https://uxdotsol.xyz/r/address-display.json
```

Replace `address-display` with an item name from `registry.json`.

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
| `lib/docs.ts` | Registry documentation, examples, and metadata |
| `registry/uxdotsol/` | Registry item source code |
| `registry.json` | Registry manifest and dependency definitions |
| `public/r/` | Generated installable registry JSON |
| `public/previews/` | Documentation preview assets |
| `components.json` | Local shadcn configuration |

## API Routes

| Route | Purpose |
|---|---|
| `/api/coin-price` | Fetches CoinGecko market and chart data |
| `/api/wallet-account` | Reads Solana account existence and SOL balance |

## Contributing

- Keep changes scoped to the relevant registry item or documentation area.
- Follow the existing TypeScript and component conventions.
- Declare every runtime dependency in `registry.json`.
- Include all required files, registry dependencies, and environment variables.
- Regenerate `public/r/` when registry source or metadata changes.
- Never include secrets, private keys, or production credentials.

## License

Released under the [MIT License](LICENSE).
