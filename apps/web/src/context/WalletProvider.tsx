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
import { demoWallet } from '../lib/contracts'
import { defaultChainId } from '../lib/chain'
import {
  ensureSepolia,
  ensureWaap,
  getWaapAccounts,
  smartWaapLogout,
  type WaapLoginMethod,
} from '../lib/waap'

type Mode = 'none' | 'waap' | 'demo'

type WalletContextValue = {
  address: string | null
  chainId: number
  mode: Mode
  loginMethod: WaapLoginMethod
  signer: Signer | null
  connecting: boolean
  error: string | null
  connectWaap: () => Promise<void>
  connectDemo: () => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

const SESSION_KEY = 'trendit.wallet.mode'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [mode, setMode] = useState<Mode>('none')
  const [loginMethod, setLoginMethod] = useState<WaapLoginMethod>(null)
  const [chainId, setChainId] = useState(defaultChainId())
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearLocal = useCallback(() => {
    setSigner(null)
    setAddress(null)
    setMode('none')
    setLoginMethod(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const bindWaapSession = useCallback(async () => {
    const waap = ensureWaap()
    if (!waap) throw new Error('WAAP unavailable')

    // eth_accounts first — eth_requestAccounts reopens the WaaP UI after login.
    const accounts = await getWaapAccounts(waap)
    if (!accounts?.[0]) throw new Error('No account returned')

    // Persist session as soon as the account is known (before chain switch).
    setAddress(accounts[0])
    setMode('waap')
    setLoginMethod(waap.getLoginMethod?.() ?? 'waap')
    localStorage.setItem(SESSION_KEY, 'waap')

    const provider = new BrowserProvider(waap as unknown as Eip1193Provider)
    const s = await provider.getSigner()
    const net = await provider.getNetwork()

    setSigner(s)
    setChainId(Number(net.chainId) || defaultChainId())

    // Non-blocking: don't hold the login UI on chain prompts
    void ensureSepolia(waap).then(async () => {
      try {
        const next = await provider.getNetwork()
        setChainId(Number(next.chainId) || defaultChainId())
      } catch {
        /* ignore */
      }
    })
  }, [])

  const applyDemo = useCallback(async () => {
    const pk = import.meta.env.VITE_DEMO_PRIVATE_KEY as string | undefined
    if (!pk) throw new Error('Demo account is not configured')
    const demo = demoWallet(pk, defaultChainId())
    setSigner(demo.signer)
    setAddress(demo.address)
    setChainId(demo.chainId)
    setMode('demo')
    setLoginMethod(null)
    localStorage.setItem(SESSION_KEY, 'demo')
  }, [])

  const connectWaap = useCallback(async () => {
    setError(null)
    const waap = ensureWaap()
    if (!waap) throw new Error('Could not start secure login')

    // Never set connecting=true for WaaP — it mounts Protected's "Connecting…"
    // overlay / navigates away and races the human.tech modal unmount.
    const choice = await waap.login()
    if (choice === null) {
      throw new Error('Sign-in cancelled')
    }

    try {
      await bindWaapSession()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed'
      setError(msg)
      throw e
    }
  }, [bindWaapSession])

  const connectDemo = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      await applyDemo()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Demo sign-in failed'
      setError(msg)
      throw e
    } finally {
      setConnecting(false)
    }
  }, [applyDemo])

  const disconnect = useCallback(async () => {
    try {
      const waap = window.waap
      if (mode === 'waap' && waap) {
        await smartWaapLogout(waap)
      }
    } catch {
      /* still clear local session */
    }
    clearLocal()
  }, [clearLocal, mode])

  const refresh = useCallback(async () => {
    if (mode === 'demo') {
      await applyDemo()
      return
    }
    if (mode === 'waap') {
      await bindWaapSession()
    }
  }, [applyDemo, bindWaapSession, mode])

  // Restore session + WAAP auto-connect (silent eth_accounts; no connecting overlay)
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY) as Mode | null
    if (saved === 'demo') {
      applyDemo().catch(() => localStorage.removeItem(SESSION_KEY))
      return
    }
    if (saved === 'waap') {
      const waap = ensureWaap()
      if (!waap) return
      bindWaapSession().catch(() => {
        localStorage.removeItem(SESSION_KEY)
      })
    }
  }, [applyDemo, bindWaapSession])

  // EIP-1193 listeners
  useEffect(() => {
    const waap = ensureWaap()
    if (!waap) return

    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || []
      if (!accounts.length) {
        clearLocal()
        return
      }
      // Soft update — do NOT call bindWaapSession (eth_requestAccounts reopens portal).
      setAddress(accounts[0])
      void (async () => {
        try {
          const provider = new BrowserProvider(waap as unknown as Eip1193Provider)
          const s = await provider.getSigner()
          setSigner(s)
        } catch {
          /* ignore signer refresh failures */
        }
      })()
    }
    const onChain = (...args: unknown[]) => {
      const id = args[0]
      const n = typeof id === 'string' ? parseInt(id, 16) : Number(id)
      if (Number.isFinite(n)) setChainId(n)
    }
    const onDisconnect = () => {
      clearLocal()
    }

    waap.on('accountsChanged', onAccounts)
    waap.on('chainChanged', onChain)
    waap.on('disconnect', onDisconnect)

    return () => {
      waap.removeListener('accountsChanged', onAccounts)
      waap.removeListener('chainChanged', onChain)
      waap.removeListener('disconnect', onDisconnect)
    }
  }, [clearLocal])

  const value = useMemo(
    () => ({
      address,
      chainId,
      mode,
      loginMethod,
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
      loginMethod,
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
