/** Deployed contract addresses. Update after `forge script` deploy. */
export const ADDRESSES = {
  /** Anvil default chainId 31337 — defaults match local forge Deploy.s.sol */
  31337: {
    mockUsdc:
      (import.meta.env.VITE_ANVIL_USDC as string) ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    escrow:
      (import.meta.env.VITE_ANVIL_ESCROW as string) ||
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  /** Base Sepolia */
  84532: {
    mockUsdc: (import.meta.env.VITE_BASE_SEPOLIA_USDC as string) || '',
    escrow: (import.meta.env.VITE_BASE_SEPOLIA_ESCROW as string) || '',
  },
} as const

export type SupportedChainId = keyof typeof ADDRESSES

export function getAddresses(chainId: number) {
  const entry = ADDRESSES[chainId as SupportedChainId]
  if (!entry?.mockUsdc || !entry?.escrow) {
    return null
  }
  return entry
}
