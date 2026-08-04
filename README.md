# Pact

**Campaign funds locked until creators deliver.**

Pact is a brand ↔ creator campaign escrow MVP. Brands lock MockUSDC in an on-chain escrow; creators submit content; mocked TikTok metrics are recorded; payout releases when the view target is met — or the brand refunds after the deadline.

Built for a hackathon demo: real Foundry contracts + a mobile-first premium web app (WAAP auth + demo wallet fallback).

## What’s real vs mock

| Real (on-chain / SDK) | Demo / mock |
|------|------|
| `MockUSDC` + `CampaignEscrow` Solidity (Foundry) | TikTok OAuth + view counts (localStorage) |
| Create / fund / submit / record / release / refund txs | Metric values invented for the demo |
| ERC-20 `transfer` send between wallets | “Get demo funds” mint (fake USDC faucet) |
| WAAP login when SDK + network work | **Demo wallet** = Anvil account #0 private key |
| Campaign list read from the chain | No separate creator accounts DB — roles = wallet actions |

**Screens:** Brand/Creator toggle · Home · Campaigns (7 mock + on-chain) · Launch Campaign (ethers escrow) · Creator Profile · Dashboard · Faucet (test ETH/USDC)

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
2. **Wallet → Receive → Get demo funds** (mint mUSDC)
3. **Create** → reward 50, min views 10000, fund
4. **Creators** tab → open the funded campaign → **Submit content URL**
5. **Connect TikTok** (mock) → **Record & release payout**
6. See success + tx hash  
   Optional: **Wallet → Send** to another Anvil address (e.g. account #1)

## Ethereum Sepolia (live deploy)

Primary testnet is **Ethereum Sepolia** (chain `11155111`).

| Contract | Address |
|----------|---------|
| MockUSDC | Set in `apps/web/.env` as `VITE_SEPOLIA_USDC` after deploy |
| CampaignEscrow | Set in `apps/web/.env` as `VITE_SEPOLIA_ESCROW` after deploy |

Deploy:

```bash
PRIVATE_KEY=0x... ./scripts/deploy-sepolia.sh
```

App `.env` defaults to `VITE_CHAIN_ID=11155111`. Demo account uses Anvil #0 (fund it on Sepolia for demos).

### Base Sepolia (legacy)

Previously deployed on Base Sepolia (`84532`):

| Contract | Address |
|----------|---------|
| MockUSDC | [`0xF07Ac92C88d2fDF634B7e20836E7E38De8EBACd2`](https://sepolia.basescan.org/address/0xF07Ac92C88d2fDF634B7e20836E7E38De8EBACd2) |
| CampaignEscrow | [`0xb5921E30AC63793591023F61D84a55Bb13488522`](https://sepolia.basescan.org/address/0xb5921E30AC63793591023F61D84a55Bb13488522) |

Redeploy Base: `PRIVATE_KEY=0x... ./scripts/deploy-base-sepolia.sh`

## WAAP

Optional `VITE_WAAP_PROJECT_ID` from human.tech portal. Without it, WAAP login may still open; use **Demo wallet** if network/SDK blocks the demo.

## Verify checklist

- [ ] `forge test` — 10 passing
- [ ] `npm run build` in `apps/web`
- [ ] Anvil running + contracts deployed
- [ ] Demo wallet signs in
- [ ] Wallet Receive mints; Send transfers mUSDC
- [ ] Create+fund campaign; Creators tab lists it
- [ ] Submit → mock TikTok → release
- [ ] Create/Wallet inputs not covered by bottom CTAs/nav

## Repo layout

```
pact/
  apps/web/          Vite + React + TS + Tailwind v4
  contracts/         Foundry MockUSDC + CampaignEscrow
  docs/superpowers/  Design + plan
```

## Note

This product lives only under `/home/demigod/PROJECTS/pact`. The older `sika` project is unrelated and was not modified.
