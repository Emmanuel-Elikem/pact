#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../contracts"
export PATH="${HOME}/.foundry/bin:${PATH}"
mkdir -p lib
if [ ! -f lib/forge-std/src/Test.sol ]; then
  rm -rf lib/forge-std
  git clone --depth 1 https://github.com/foundry-rs/forge-std.git lib/forge-std
  rm -rf lib/forge-std/.git
fi
if [ ! -f lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol ]; then
  rm -rf lib/openzeppelin-contracts
  git clone --depth 1 --branch v5.2.0 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
  rm -rf lib/openzeppelin-contracts/.git
fi
echo "Contracts deps ready"
