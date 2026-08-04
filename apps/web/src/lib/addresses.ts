/** Deployed contract addresses. Update after `forge script` deploy. */
export const ADDRESSES = {
  /** Anvil default chainId 31337 */
  31337: {
    mockUsdc:
      (import.meta.env.VITE_ANVIL_USDC as string) ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    escrow:
      (import.meta.env.VITE_ANVIL_ESCROW as string) ||
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  /** Ethereum Sepolia */
  11155111: {
    mockUsdc:
      (import.meta.env.VITE_SEPOLIA_USDC as string) ||
      '0x3AB4a2df7b5FF19B142B401334B4Dd3142545cDe',
    escrow:
      (import.meta.env.VITE_SEPOLIA_ESCROW as string) ||
      '0x64cd1ECB0233F9a011581D608BACc2C2ceFC6b7F',
  },
  /** Base Sepolia */
  84532: {
    mockUsdc:
      (import.meta.env.VITE_BASE_SEPOLIA_USDC as string) ||
      '0xF07Ac92C88d2fDF634B7e20836E7E38De8EBACd2',
    escrow:
      (import.meta.env.VITE_BASE_SEPOLIA_ESCROW as string) ||
      '0xb5921E30AC63793591023F61D84a55Bb13488522',
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
