export const ANVIL_CHAIN_ID = 31337
export const SEPOLIA_CHAIN_ID = 11155111
export const BASE_SEPOLIA_CHAIN_ID = 84532

export const CHAINS = {
  [ANVIL_CHAIN_ID]: {
    id: ANVIL_CHAIN_ID,
    name: 'Anvil',
    rpcUrl: (import.meta.env.VITE_ANVIL_RPC as string) || 'http://127.0.0.1:8545',
    explorer: '',
  },
  [SEPOLIA_CHAIN_ID]: {
    id: SEPOLIA_CHAIN_ID,
    name: 'Ethereum Sepolia',
    rpcUrl:
      (import.meta.env.VITE_SEPOLIA_RPC as string) ||
      'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    id: BASE_SEPOLIA_CHAIN_ID,
    name: 'Base Sepolia',
    rpcUrl:
      (import.meta.env.VITE_BASE_SEPOLIA_RPC as string) ||
      'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
  },
} as const

export function defaultChainId(): number {
  // Prefer Ethereum Sepolia for deployed demos; override with VITE_CHAIN_ID=31337 for Anvil.
  const fromEnv = Number(import.meta.env.VITE_CHAIN_ID || SEPOLIA_CHAIN_ID)
  return fromEnv in CHAINS ? fromEnv : SEPOLIA_CHAIN_ID
}

export function explorerTx(chainId: number, hash: string): string | null {
  const base = CHAINS[chainId as keyof typeof CHAINS]?.explorer
  if (!base) return null
  return `${base}/tx/${hash}`
}
