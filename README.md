# Pact

**Campaign funds locked until creators deliver.**

Pact is a brand ↔ creator campaign escrow MVP. Brands lock MockUSDC in an on-chain escrow; creators submit content; mocked TikTok metrics are recorded; payout releases when the view target is met — or the brand refunds after the deadline.

Built for a hackathon demo: real Foundry contracts + a mobile-first premium web app (WAAP auth + demo wallet fallback).

## What’s real vs mock

| Real | Mock |
|------|------|
| `MockUSDC` + `CampaignEscrow` Solidity (Foundry) | TikTok OAuth / metrics API |
| On-chain txs via Anvil (or Base Sepolia addresses) | Metric values from localStorage mock |
| WAAP (`@human.tech/waap-sdk`) when available | Demo Anvil private key fallback |

## UI

Mobile-first app shell (~430px phone column on desktop), navy stadium CTAs, floating glass pill nav, hero escrow gradient card, large money hierarchy — patterns inspired by modern fintech/mobile references (not Affirm/Opal branding).

## Quick start

### Prerequisites

- Node 20+ (`nvm use 20`)
- Foundry (`forge`, `cast`, `anvil`)

### 1. Contracts

```bash
cd /home/demigod/PROJECTS/pact
./scripts/setup-contracts.sh   # first clone only
cd contracts
forge test
# terminal A
anvil
# terminal B
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Copy logged `MockUSDC` / `CampaignEscrow` addresses into `apps/web/.env` (see `.env.example`). Defaults in `src/lib/addresses.ts` match a fresh Anvil deploy (CREATE order).

### 2. Web

```bash
cd /home/demigod/PROJECTS/pact/apps/web
cp .env.example .env   # or use existing .env
npm install
npm run dev
```

Open http://127.0.0.1:5173 → **Demo wallet** for local Anvil.

### 3-minute demo script

1. Sign in with **Demo wallet**
2. **Faucet** → mint 500 mUSDC
3. **Create** → reward 50, min views 10000, fund
4. On campaign: **Submit content URL** (same wallet can act as creator for demo)
5. **Connect TikTok** (mock) → **Record & release payout**
6. See success + tx hash

## Base Sepolia

Set `VITE_CHAIN_ID=84532`, deploy with a funded key:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --private-key $PK
```

Set `VITE_BASE_SEPOLIA_USDC` / `VITE_BASE_SEPOLIA_ESCROW`.

## WAAP

Optional `VITE_WAAP_PROJECT_ID` from human.tech portal. Without it, WAAP login may still open; use **Demo wallet** if network/SDK blocks the demo.

## Verify checklist

- [ ] `forge test` — 10 passing
- [ ] `npm run build` in `apps/web`
- [ ] Anvil running + contracts deployed
- [ ] Demo wallet signs in
- [ ] Faucet mints; create+fund campaign
- [ ] Submit → mock TikTok → release
- [ ] UI readable at ~390px width; bottom pill nav visible

## Repo layout

```
pact/
  apps/web/          Vite + React + TS + Tailwind v4
  contracts/         Foundry MockUSDC + CampaignEscrow
  docs/superpowers/  Design + plan
```

## Note

This product lives only under `/home/demigod/PROJECTS/pact`. The older `sika` project is unrelated and was not modified.
