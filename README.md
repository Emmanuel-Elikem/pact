# Trendit

Programmable creator campaign marketplace. Brands lock **MockUSDC** in on-chain escrow; creators apply and submit content; mocked engagement metrics decide payout; funds release (or refund) on-chain.

**Live app:** [https://web-lime-seven-27.vercel.app](https://web-lime-seven-27.vercel.app)

## Stack

- **Web:** React + TypeScript + Vite + Tailwind
- **Chain:** ethers v6, Foundry contracts, WaaP auth (+ demo wallet fallback)
- **Primary network:** Ethereum Sepolia (`11155111`)

## Live contracts (Ethereum Sepolia)

| Contract | Address |
|----------|---------|
| MockUSDC | [`0x3AB4a2df7b5FF19B142B401334B4Dd3142545cDe`](https://sepolia.etherscan.io/address/0x3AB4a2df7b5FF19B142B401334B4Dd3142545cDe) |
| CampaignEscrow | [`0x64cd1ECB0233F9a011581D608BACc2C2ceFC6b7F`](https://sepolia.etherscan.io/address/0x64cd1ECB0233F9a011581D608BACc2C2ceFC6b7F) |

Base Sepolia (`84532`) remains optional/legacy — see `addresses.ts` / `.env.example`.

## Features

- Brand / creator roles
- Create & fund campaigns with editable reward
- WaaP login + demo wallet
- Submit content → record mocked metrics → on-chain payout / refund

## Setup

**Prereqs:** Node 20+, Foundry (`forge`, `cast`, `anvil`)

```bash
# Web
cd apps/web
cp .env.example .env
npm install
npm run dev
```

Key env vars (see `apps/web/.env.example`):

```bash
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
VITE_SEPOLIA_USDC=0x3AB4a2df7b5FF19B142B401334B4Dd3142545cDe
VITE_SEPOLIA_ESCROW=0x64cd1ECB0233F9a011581D608BACc2C2ceFC6b7F
# Optional: VITE_WAAP_PROJECT_ID=
```

**Redeploy Sepolia:**

```bash
PRIVATE_KEY=0x... ./scripts/deploy-sepolia.sh
```

**Local Anvil (optional):**

```bash
./scripts/setup-contracts.sh   # first clone
cd contracts && forge test
# terminal A: anvil
# terminal B: forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Copy Anvil addresses into `.env` if needed. Defaults in `apps/web/src/lib/addresses.ts` match a fresh CREATE deploy.

## Layout

```
apps/web/       Vite + React + TS + Tailwind
contracts/      Foundry — MockUSDC + CampaignEscrow
scripts/        deploy-sepolia.sh, deploy-base-sepolia.sh
```
