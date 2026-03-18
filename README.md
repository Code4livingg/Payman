# Payman

Payman is an autonomous USDT payment agent: users type natural-language commands, and the app converts those commands into structured draft actions with explicit confirmation before any transfer. It is designed as a "ChatGPT with a bank account" demo for the Tether WDK hackathon, with policy guardrails, recurring schedules, invoice workflows, and proactive monitoring.

The product experience focuses on safe execution and demo reliability. If live blockchain, Claude API, or webhook dependencies are unavailable, Payman falls back to deterministic parsing and clearly marked simulation paths so the demo remains fully usable end-to-end.

## Core Features

- Natural-language chat for send, schedule, invoice, and query intents
- Multi-turn draft payment flow with explicit confirmation gate
- Policy guardrails (single cap, daily cap, whitelist, duplicate blocking, memo rules)
- Wallet API with WDK-first transfer flow and ethers fallback
- Prisma + SQLite persistence for users, transactions, policy, and insights
- Recurring schedule CRUD and due-payment execution endpoint
- Invoice generation, shareable invoice page, and status watcher
- Activity feed with typed event system and color-coded statuses
- Proactive monitors for overdue invoices and low-balance warnings
- GitHub webhook endpoint with signature verification and trigger messaging

## Architecture Summary

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Client state persistence via localStorage keys:
  - `payman_messages`
  - `payman_draft`
  - `payman_policy`
  - `payman_activity`
  - `payman_schedules`
  - `payman_invoices`
- API routes:
  - `/api/agent` Claude parser + deterministic fallback parser
  - `/api/wallet` guardrail checks, quote, send, wallet balance
  - `/api/transactions` persistent transaction history
  - `/api/policy` persistent policy engine
  - `/api/insights` computed financial insights
  - `/api/schedule` schedule CRUD
  - `/api/cron` due schedule execution pipeline
  - `/api/webhooks/github` signed webhook trigger
- WDK integration in `lib/wdk.ts` using actual account methods (`getAccount`, `getAddress`, `getTokenBalance`, `quoteTransfer`, `transfer`) with ethers-based ERC20 fallback.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

## Stability Workflow

- Before major demos or large refactors, clear build artifacts to avoid stale chunk issues:

```bash
rm -rf .next
```
- Use a consistent Node.js runtime (current validated: `v20.20.0`) across all environments.

4. Initialize Prisma database (first run):

```bash
npm run prisma:generate
npm run prisma:push
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Optional Claude parser key
- `WDK_SEED_PHRASE` - Seed phrase for wallet initialization
- `DATABASE_URL` - SQLite connection string (default `file:./dev.db`)
- `NEXT_PUBLIC_WALLET_ADDRESS` - Optional display fallback address
- `NEXT_PUBLIC_WDK_INDEXER_BASE_URL` - Optional indexer base URL
- `WDK_INDEXER_API_KEY` - Optional indexer API key
- `ETHEREUM_RPC_URL` - Sepolia RPC URL
- `GITHUB_WEBHOOK_SECRET` - Secret for GitHub webhook signature verification
- `SEPOLIA_USDT_ADDRESS` - Optional token address for live Sepolia USDT transfer
- `NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS` - Browser-side USDT contract for MetaMask transfer mode

## Third-Party Disclosures

- Anthropic Claude API is used when `ANTHROPIC_API_KEY` is configured.
- An EVM RPC provider (for example Alchemy or another Sepolia endpoint) is required for live chain reads/writes.

## Demo Fallback Notes

- If Claude is unavailable, deterministic regex/rule-based parsing remains active.
- If WDK or token transfer execution is unavailable in the runtime, Payman returns clearly marked demo-mode tx hashes while preserving all guardrail checks.
- Invoice watcher and proactive monitors use robust local activity matching for a reliable demo flow.

## License

This project is intended for Apache 2.0 licensed usage patterns, consistent with Tether WDK ecosystem licensing.
