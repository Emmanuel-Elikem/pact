import { initWaaP } from '@human.tech/waap-sdk'
import { TRENDIT_LOGO_BASE64 } from '../components/BrandMark'
import { SEPOLIA_CHAIN_ID, CHAINS } from './chain'

export type WaapLoginMethod = 'waap' | 'injected' | 'walletconnect' | null

export type WaapProvider = {
  login: (injectedProvider?: unknown) => Promise<WaapLoginMethod>
  getLoginMethod: () => WaapLoginMethod
  logout: () => Promise<void>
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  requestEmail?: () => Promise<string>
  on: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    waap?: WaapProvider
  }
}

let initialized = false

export function ensureWaap(): WaapProvider | null {
  if (typeof window === 'undefined') return null
  if (initialized && window.waap) return window.waap

  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
    | string
    | undefined
  const projectId = import.meta.env.VITE_WAAP_PROJECT_ID as string | undefined

  initWaaP({
    useStaging: false,
    ...(walletConnectProjectId ? { walletConnectProjectId } : {}),
    project: {
      name: 'Trendit',
      entryTitle: 'Welcome to Trendit',
      logo: TRENDIT_LOGO_BASE64,
      ...(projectId ? { projectId } : {}),
    },
    config: {
      allowedSocials: ['google', 'twitter', 'discord'],
      authenticationMethods: walletConnectProjectId
        ? (['email', 'phone', 'social', 'wallet'] as const)
        : (['email', 'phone', 'social'] as const),
      styles: { darkMode: false },
      showSecured: true,
    },
  })

  initialized = true
  return window.waap ?? null
}

/**
 * Prefer eth_accounts (silent) so we never reopen the WaaP portal after login.
 * Only fall back to eth_requestAccounts when no accounts are already authorized.
 */
export async function getWaapAccounts(waap: WaapProvider): Promise<string[]> {
  try {
    const existing = (await waap.request({ method: 'eth_accounts' })) as string[]
    if (existing?.[0]) return existing
  } catch {
    /* fall through to request */
  }
  const requested = (await waap.request({ method: 'eth_requestAccounts' })) as string[]
  return requested ?? []
}

/** Ensure Ethereum Sepolia is available and selected */
export async function ensureSepolia(waap: WaapProvider) {
  const chain = CHAINS[SEPOLIA_CHAIN_ID]
  const hexId = `0x${SEPOLIA_CHAIN_ID.toString(16)}`
  try {
    await waap.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexId }],
    })
  } catch {
    try {
      await waap.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexId,
            chainName: chain.name,
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorer],
          },
        ],
      })
      await waap.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexId }],
      })
    } catch {
      /* user may reject; continue with current chain */
    }
  }
}

export async function smartWaapLogout(waap: WaapProvider) {
  const method = waap.getLoginMethod?.() ?? null
  await waap.logout()
  return method
}
