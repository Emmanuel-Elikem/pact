import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BrowserProvider, type Eip1193Provider, type Signer } from 'ethers'
import { initWaaP } from '@human.tech/waap-sdk'
import { demoWallet } from '../lib/contracts'
import { defaultChainId } from '../lib/chain'

type Mode = 'none' | 'waap' | 'demo'

type WalletContextValue = {
  address: string | null
  chainId: number
  mode: Mode
  signer: Signer | null
  connecting: boolean
  error: string | null
  connectWaap: () => Promise<void>
  connectDemo: () => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

const SESSION_KEY = 'pact.wallet.mode'

declare global {
  interface Window {
    waap?: {
      login: () => Promise<unknown>
      logout: () => Promise<unknown>
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, listener: (...args: unknown[]) => void) => void
      removeListener: (event: string, listener: (...args: unknown[]) => void) => void
      isConnected?: () => boolean
    }
  }
}

function ensureWaap() {
  if (typeof window === 'undefined') return null
  if (window.waap) return window.waap
  const projectId = import.meta.env.VITE_WAAP_PROJECT_ID as string | undefined
  initWaaP({
    project: {
      name: 'Pact',
      entryTitle: 'Sign in to Pact',
      ...(projectId ? { projectId } : {}),
    },
    config: {
      styles: { darkMode: false },
    },
  })
  return window.waap ?? null
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [mode, setMode] = useState<Mode>('none')
  const [chainId, setChainId] = useState(defaultChainId())
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applySession = useCallback(async (next: Mode) => {
    if (next === 'demo') {
      const pk = import.meta.env.VITE_DEMO_PRIVATE_KEY as string | undefined
      if (!pk) throw new Error('Set VITE_DEMO_PRIVATE_KEY for demo wallet mode')
      const demo = demoWallet(pk, defaultChainId())
      setSigner(demo.signer)
      setAddress(demo.address)
      setChainId(demo.chainId)
      setMode('demo')
      localStorage.setItem(SESSION_KEY, 'demo')
      return
    }
    if (next === 'waap') {
      const waap = ensureWaap()
      if (!waap) throw new Error('WAAP unavailable')
      const provider = new BrowserProvider(waap as unknown as Eip1193Provider)
      const s = await provider.getSigner()
      const net = await provider.getNetwork()
      setSigner(s)
      setAddress(await s.getAddress())
      setChainId(Number(net.chainId))
      setMode('waap')
      localStorage.setItem(SESSION_KEY, 'waap')
      return
    }
    setSigner(null)
    setAddress(null)
    setMode('none')
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const connectWaap = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const waap = ensureWaap()
      if (!waap) throw new Error('WAAP SDK failed to initialize')
      await waap.login()
      await applySession('waap')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'WAAP login failed'
      setError(msg)
      throw e
    } finally {
      setConnecting(false)
    }
  }, [applySession])

  const connectDemo = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      await applySession('demo')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Demo wallet failed'
      setError(msg)
      throw e
    } finally {
      setConnecting(false)
    }
  }, [applySession])

  const disconnect = useCallback(async () => {
    try {
      if (mode === 'waap' && window.waap?.logout) await window.waap.logout()
    } catch {
      /* ignore */
    }
    await applySession('none')
  }, [applySession, mode])

  const refresh = useCallback(async () => {
    if (mode === 'none') return
    await applySession(mode)
  }, [applySession, mode])

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY) as Mode | null
    if (saved === 'demo' || saved === 'waap') {
      applySession(saved).catch(() => localStorage.removeItem(SESSION_KEY))
    }
  }, [applySession])

  const value = useMemo(
    () => ({
      address,
      chainId,
      mode,
      signer,
      connecting,
      error,
      connectWaap,
      connectDemo,
      disconnect,
      refresh,
    }),
    [
      address,
      chainId,
      mode,
      signer,
      connecting,
      error,
      connectWaap,
      connectDemo,
      disconnect,
      refresh,
    ],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
