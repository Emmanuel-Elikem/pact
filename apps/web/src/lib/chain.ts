export const ANVIL_CHAIN_ID = 31337
export const BASE_SEPOLIA_CHAIN_ID = 84532

export const CHAINS = {
  [ANVIL_CHAIN_ID]: {
    id: ANVIL_CHAIN_ID,
    name: 'Anvil',
    rpcUrl: (import.meta.env.VITE_ANVIL_RPC as string) || 'http://127.0.0.1:8545',
    explorer: '',
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
  const fromEnv = Number(import.meta.env.VITE_CHAIN_ID || ANVIL_CHAIN_ID)
  return fromEnv in CHAINS ? fromEnv : ANVIL_CHAIN_ID
}

export function explorerTx(chainId: number, hash: string): string | null {
  const base = CHAINS[chainId as keyof typeof CHAINS]?.explorer
  if (!base) return null
  return `${base}/tx/${hash}`
}
