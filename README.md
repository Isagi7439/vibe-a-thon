# 📱 Smartphone AI Agent

> A TypeScript CLI agent that recommends the top 10 smartphones based on your requirements — powered by **Groq AI**, **Avalanche blockchain**, and **x402 payments**.

---

## Features

- 🤖 **AI-powered ranking** — Groq Llama 3.3 70B analyzes and ranks phones tailored to your needs
- 🌐 **Live internet research** — Serper.dev Google Search API fetches real-time data
- ⛓️ **Avalanche integration** — Logs recommendation hashes on-chain via ethers.js v6
- 💳 **x402 support** — Automatic HTTP 402 payment handling via EIP-3009
- 📋 **Rich CLI** — Interactive prompts, colored output, and comparison table
- 🔌 **Offline fallback** — 20-phone curated dataset (no API key required)

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Installation

```bash
# 1. Clone / enter the project
cd smartphone-ai-agent

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see below)
```

---

## Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | **Yes** | [console.groq.com](https://console.groq.com) — free |
| `SERPER_API_KEY` | Optional | [serper.dev](https://serper.dev) — 2500 free searches/month |
| `AVALANCHE_RPC` | Optional | Defaults to Avalanche Mainnet |
| `PRIVATE_KEY` | Optional | Wallet key for on-chain logging |
| `X402_ENABLED` | Optional | `true` or `false` (default: `true`) |
| `GROQ_MODEL` | Optional | Default: `llama-3.3-70b-versatile` |

---

## Usage

```bash
# Run the interactive CLI
npm start

# Or directly
npx ts-node src/cli/cli.ts
```

### Example Session

```
╔═══════════════════════════════════════════════════════╗
║       📱  SMARTPHONE AI AGENT  v1.0.0                ║
║       Powered by Groq AI · Avalanche · x402           ║
╚═══════════════════════════════════════════════════════╝

  System Status:
  ✓ LLM         : llama-3.3-70b-versatile
  ✓ Research    : Serper API (live search)
  ✓ x402        : Enabled
  ○ Avalanche   : No PRIVATE_KEY — on-chain logging skipped

  ─── Tell us about your ideal smartphone ────────────────

  💰 What is your budget range? $400-$700
  ⚡ Preferred processor brand? Snapdragon
  🧠 Minimum RAM required? 8 GB
  💾 Minimum internal storage? 128 GB
  📸 How important is the camera? high
  🎯 Primary usage type? all-rounder
  🏷  Preferred brand? (leave blank)
  🖥  Display preference? 120Hz AMOLED
  🔋 Battery preference? 5000mAh+

  🚀 Ready to find your perfect smartphone? Yes

  ─── Starting Analysis Pipeline ─────────────────────

  ✓ Found 28 phone candidates
  ✓ AI ranked 10 phones

═════════════════════════════════════════════════════════════════
  📱  TOP 10 SMARTPHONE RECOMMENDATIONS
  Budget: $400-$700 | Usage: all-rounder | Camera: high

  🥇 OnePlus 12   ⭐ all-rounder
  ─────────────────────────────────────────────────────────────
  💰 Price          $799
  ⚡ Processor      Snapdragon 8 Gen 3
  ...
```

---

## Project Architecture

```
src/
├── agent/
│   └── agent.ts            # Main orchestration pipeline
├── cli/
│   ├── cli.ts              # Interactive CLI entry point
│   └── formatter.ts        # Terminal output formatting
├── research/
│   └── researchService.ts  # Serper API search + fallback dataset
├── ranking/
│   └── rankingEngine.ts    # LLM-powered phone ranking
├── services/
│   └── llmService.ts       # Groq SDK wrapper
├── web3/
│   ├── avalancheService.ts # Avalanche C-Chain integration
│   └── x402Integration.ts  # x402 HTTP payment interceptor
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

---

## Web3 Integration Details

### Avalanche Blockchain
- Connects to Avalanche C-Chain (mainnet or Fuji testnet)
- Logs a SHA-256 hash of recommendation results as transaction data
- Each recommendation run is immutably recorded on-chain
- View on [Snowtrace Explorer](https://snowtrace.io)

### x402 Protocol
- Wraps the HTTP client with automatic 402 payment handling
- Implements [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) `TransferWithAuthorization` for USDC payments
- Activates automatically when any API responds with `HTTP 402`
- Compatible with Coinbase's x402 facilitator

---

## Build for Production

```bash
npm run build         # Compile TypeScript → dist/
node dist/cli/cli.js  # Run compiled version
```

## Type Checking

```bash
npm run typecheck
```

---

## Getting API Keys

| Service | URL | Cost |
|---|---|---|
| Groq | https://console.groq.com | Free |
| Serper | https://serper.dev | Free (2500 searches/month) |
| Avalanche | https://core.app | Need wallet + tiny AVAX for gas |
