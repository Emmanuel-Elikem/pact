#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.foundry/bin:${PATH}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

RPC="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
PK="${PRIVATE_KEY:-${DEPLOYER_PRIVATE_KEY:-}}"

if [[ -z "${PK}" ]]; then
  echo "Missing PRIVATE_KEY (funded Base Sepolia account)."
  echo "Create one: cast wallet new"
  echo "Fund via https://www.coinbase.com/faucets/base-sepolia-faucet"
  echo "Then: PRIVATE_KEY=0x... ./scripts/deploy-base-sepolia.sh"
  exit 1
fi

ADDR="$(cast wallet address --private-key "$PK")"
BAL="$(cast balance "$ADDR" --rpc-url "$RPC")"
echo "Deployer: $ADDR"
echo "Balance:  $BAL wei"

if [[ "$BAL" == "0" ]]; then
  echo "Deployer has 0 ETH on Base Sepolia. Fund it, then re-run."
  exit 1
fi

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC" \
  --broadcast \
  --private-key "$PK" \
  -vvvv

echo ""
echo "Copy MockUSDC + CampaignEscrow into apps/web/.env:"
echo "  VITE_CHAIN_ID=84532"
echo "  VITE_BASE_SEPOLIA_USDC=..."
echo "  VITE_BASE_SEPOLIA_ESCROW=..."
echo "  VITE_BASE_SEPOLIA_RPC=$RPC"
