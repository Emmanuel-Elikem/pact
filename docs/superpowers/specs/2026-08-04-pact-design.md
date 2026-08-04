# Pact Design Spec

**Date:** 2026-08-04  
**Product:** Pact — brand ↔ creator campaign escrow  
**Tagline:** Campaign funds locked until creators deliver.  
**Approach:** A (approved) — Vite web + Foundry escrow + WAAP + mock TikTok

## Pitch

Pact locks campaign rewards in on-chain escrow and releases payout only when a creator hits the agreed metric. Brands create and fund campaigns with MockUSDC; creators submit content; metrics are recorded (demo: mocked TikTok views); escrow releases or refunds. A clear brand–creator agreement — trust without crypto-bro theater.

## Audience & job

- **Audience:** Hackathon judges + Ghanaian brands/creators demo  
- **Job of UI:** Make the escrow loop feel simple, trustworthy, friendly — Material 3–inspired, soft tonal surfaces, clear Brand vs Creator actions

## Visual system

### Palette (tokens)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#FFF8F1` | Warm off-white page |
| `--ink` | `#1C1917` | Primary text |
| `--cocoa` | `#3D2314` | Brand / emphasis |
| `--leaf` | `#2F6F4E` | Success / primary CTA |
| `--gold` | `#E8B84A` | Accent / progress |
| `--surface` | `#FFFFFF` | Cards / sheets |
| `--muted` | `#78716C` | Secondary text |
| `--surface-tonal` | `#F3EDE4` | Soft tonal fills |

Avoid: purple gradients, cream+terracotta serif cliché, broadsheet, dark-mode default, glow spam.

### Typography

- **Display:** Fraunces (soft character for brand wordmark / heroes)  
- **Body / UI:** Plus Jakarta Sans  

### Shape & elevation

- Ultra-rounded: buttons/FABs `border-radius: 999px`; cards `24–28px`  
- Soft tonal fills; Material 3–like spacing (8pt grid)  
- Icons: lucide-react, consistent stroke, touch targets ≥44px

### Signature motion

1. **Pact pulse** — animated progress ring / locked-fund capsule that fills as campaign progresses  
2. Page enter / list stagger (framer-motion)  
3. Tx pending → success toast microfeedback  

## Routes

| Route | Purpose |
|-------|---------|
| `/signin` | WAAP login + Demo wallet fallback |
| `/` | Campaign list |
| `/campaigns/new` | Create + approve + fund |
| `/campaigns/:id` | Detail: submit, mock TikTok, record+release, refund |
| `/faucet` | Mint MockUSDC |

## Core loop

1. Sign in (WAAP primary; Demo wallet secondary)  
2. Brand mints MockUSDC  
3. Brand creates campaign (reward, min views, deadline)  
4. Brand approves USDC + funds escrow  
5. Creator submits content URL  
6. Mock TikTok connect → mocked view_count  
7. Brand/oracle `recordMetric` + `releasePayout`  
8. Success UI (amounts + tx hashes)  
9. Nice-to-have: `refund` past deadline if unmet  

## Contracts

- **MockUSDC:** ERC20, 6 decimals, public `mint(to, amount)`  
- **CampaignEscrow:** ReentrancyGuard; create / fund / submit / recordMetric / release / refund  
- Local Anvil + Base Sepolia config

## Auth

- Primary: `@human.tech/waap-sdk` → `initWaaP` → `window.waap.login()` → EIP-1193  
- Fallback: Demo mode with `VITE_DEMO_PRIVATE_KEY` — clearly labeled  

## Mock vs real

| Real | Mock |
|------|------|
| Solidity escrow + MockUSDC | TikTok OAuth / metrics API |
| On-chain txs | Metric values from local mock |
| WAAP when configured | Demo wallet when WAAP unavailable |

## Non-goals

Real TikTok API, multi-creator campaigns, production oracle, mobile native apps.
