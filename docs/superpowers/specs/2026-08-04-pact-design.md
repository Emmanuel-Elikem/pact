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

Mobile-first premium fintech (patterns from Affirm/health refs — not their branding):

- Phone column shell (`max-width: 28rem`), soft grey page chrome
- Deep navy primary CTAs (`#0B1F3A`), black secondary, floating glass pill bottom nav
- Hero escrow gradient card (navy→indigo) with eye/copy for address
- Big money hierarchy, tonal white cards ~24px radius, thin Lucide icons
- Status accent indigo for state labels

### Palette (tokens)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F5F5F7` | App background |
| `--surface` | `#FFFFFF` | Cards |
| `--ink` / `--navy` | `#0B1F3A` | Text + primary buttons |
| `--accent` | `#4F46E5` | Status / links |
| `--muted` | `#8B93A7` | Labels |
| `--leaf` | `#16A34A` | Success |
| `--gold` | `#C9A227` | Soft accent |

Avoid: purple-everything landing pages, Affirm/Opal logos, dark mode default, neo-brutal stickers.

### Typography

- **Display:** Fraunces (wordmark sparingly)
- **Body / UI:** Plus Jakarta Sans — large bold amounts, small grey labels

### Signature motion

1. **Escrow pulse** — circular progress ring filling Created→Paid  
2. List/card enter stagger  
3. Tx pending → success toasts  

Respect `prefers-reduced-motion`.

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
