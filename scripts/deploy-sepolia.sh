#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.foundry/bin:${PATH}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

RPC="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
PK="${PRIVATE_KEY:-${DEPLOYER_PRIVATE_KEY:-}}"

if [[ -z "${PK}" ]]; then
  echo "Missing PRIVATE_KEY (funded Ethereum Sepolia account)."
  echo "Create one: cast wallet new"
  echo "Fund via https://sepoliafaucet.com or https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
  echo "Then: PRIVATE_KEY=0x... ./scripts/deploy-sepolia.sh"
  exit 1
fi

ADDR="$(cast wallet address --private-key "$PK")"
BAL="$(cast balance "$ADDR" --rpc-url "$RPC")"
echo "Deployer: $ADDR"
echo "Balance:  $BAL wei"
echo "RPC:      $RPC"
echo "Chain:    Ethereum Sepolia (11155111)"

if [[ "$BAL" == "0" ]]; then
  echo "Deployer has 0 ETH on Ethereum Sepolia. Fund it, then re-run."
  exit 1
fi

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC" \
  --broadcast \
  --private-key "$PK" \
  -vvvv

echo ""
echo "Copy MockUSDC + CampaignEscrow into apps/web/.env:"
echo "  VITE_CHAIN_ID=11155111"
echo "  VITE_SEPOLIA_USDC=..."
echo "  VITE_SEPOLIA_ESCROW=..."
echo "  VITE_SEPOLIA_RPC=$RPC"
