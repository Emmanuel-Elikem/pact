import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Coins, Copy } from 'lucide-react'
import { formatEther } from 'ethers'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { getContracts, readProvider } from '../lib/contracts'
import { formatUsdc, parseUsdc, truncateAddress } from '../lib/format'
import { loadCreatorProfile } from '../lib/store'

const DEMO_AMOUNT = '1000'

/** One-click demo USDC top-up for the connected wallet */
export function Funds() {
  const navigate = useNavigate()
  const { signer, chainId, address } = useWallet()
  const { withTx, push } = useToast()
  const [ethBal, setEthBal] = useState<string>('—')
  const [usdcBal, setUsdcBal] = useState<string>('—')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const username = loadCreatorProfile().username.trim()

  async function copyAddress() {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      push({ kind: 'success', title: 'Address copied' })
    } catch {
      push({ kind: 'error', title: 'Could not copy address' })
    }
  }

  async function copyUsername() {
    if (!username) return
    try {
      await navigator.clipboard.writeText(username)
      push({ kind: 'success', title: 'Username copied' })
    } catch {
      push({ kind: 'error', title: 'Could not copy username' })
    }
  }

  async function refresh() {
    if (!address) return
    const provider = readProvider(chainId)
    try {
      const wei = await provider.getBalance(address)
      setEthBal(Number(formatEther(wei)).toFixed(4))
    } catch {
      setEthBal('—')
    }
    try {
      const { usdc } = getContracts(provider, chainId)
      setUsdcBal(formatUsdc(await usdc.balanceOf(address)))
    } catch {
      setUsdcBal('—')
    }
  }

  useEffect(() => {
    void refresh()
  }, [address, chainId])

  async function getDemoFunds() {
    if (!address) {
      push({
        kind: 'info',
        title: 'Sign in first',
        detail: 'Connect your account, then tap Get demo funds.',
      })
      navigate('/signin')
      return
    }

    setBusy(true)
    try {
      const r = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId }),
      })
      const data = (await r.json()) as {
        ok?: boolean
        amount?: string
        error?: string
      }

      if (r.ok) {
        const amt = data.amount || DEMO_AMOUNT
        setLast(`You received $${amt} demo USDC.`)
        push({
          kind: 'success',
          title: `You received $${amt} demo USDC`,
          detail: 'Ready to fund campaigns.',
        })
        await refresh()
        return
      }

      // Fallback: MockUSDC has public mint — mint from connected wallet
      if (signer) {
        await withTx('Get demo funds', async () => {
          const { usdc } = getContracts(signer, chainId)
          await (await usdc.mint(address, parseUsdc(DEMO_AMOUNT))).wait()
        })
        setLast(`You received $${DEMO_AMOUNT} demo USDC.`)
        push({
          kind: 'success',
          title: `You received $${DEMO_AMOUNT} demo USDC`,
          detail: 'Ready to fund campaigns.',
        })
        await refresh()
        return
      }

      throw new Error(data.error || 'Faucet failed')
    } catch (e) {
      push({
        kind: 'error',
        title: 'Could not get demo funds',
        detail: e instanceof Error ? e.message : 'Try again',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">For testing</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">Add demo funds</h1>
      </div>
      <p className="text-sm text-muted">
        One tap adds ${DEMO_AMOUNT} demo USDC (test dollars) to your signed-in wallet — enough to
        create, fund, and try a creator payout. Not real cash.
      </p>

      <div className="card-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your account</p>
        {address ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 font-mono text-sm font-semibold text-ink">
              {truncateAddress(address, 6)}
            </p>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-border hover:bg-navy-soft"
              aria-label="Copy wallet address"
            >
              <Copy className="size-3.5" />
              Copy
            </button>
          </div>
        ) : (
          <p className="mt-1 font-mono text-sm font-semibold text-ink">Not signed in</p>
        )}
        {username ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm text-muted">@{username}</p>
            <button
              type="button"
              onClick={() => void copyUsername()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-muted hover:bg-bg hover:text-navy"
              aria-label="Copy username"
            >
              <Copy className="size-3" />
              Copy
            </button>
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-bg px-3 py-3">
            <p className="text-[11px] text-muted">Network balance</p>
            <p className="text-lg font-bold">{ethBal}</p>
          </div>
          <div className="rounded-2xl bg-bg px-3 py-3">
            <p className="text-[11px] text-muted">Demo USDC (test dollars)</p>
            <p className="text-lg font-bold">${usdcBal}</p>
          </div>
        </div>
      </div>

      <Button loading={busy} onClick={() => void getDemoFunds()}>
        <Coins className="size-4" /> Get demo funds
      </Button>

      {last && (
        <div className="rounded-[1.5rem] bg-leaf-soft p-5">
          <div className="flex items-center gap-2 text-leaf">
            <CheckCircle2 className="size-5" />
            <p className="font-bold">All set</p>
          </div>
          <p className="mt-2 text-sm text-ink">{last}</p>
        </div>
      )}
    </div>
  )
}
