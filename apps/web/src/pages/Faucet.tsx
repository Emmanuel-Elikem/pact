import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets } from 'lucide-react'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { getContracts, readProvider } from '../lib/contracts'
import { formatUsdc, parseUsdc } from '../lib/format'

export function Faucet() {
  const { signer, chainId, address } = useWallet()
  const { withTx } = useToast()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('500')
  const [balance, setBalance] = useState<bigint | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    if (!address) return
    try {
      const { usdc } = getContracts(readProvider(chainId), chainId)
      setBalance(await usdc.balanceOf(address))
    } catch {
      setBalance(null)
    }
  }

  useEffect(() => {
    void refresh()
  }, [address, chainId])

  async function mint() {
    if (!signer || !address) return
    setBusy(true)
    try {
      await withTx('Mint MockUSDC', async () => {
        const { usdc } = getContracts(signer, chainId)
        const tx = await usdc.mint(address, parseUsdc(amount))
        await tx.wait()
      })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-border"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold text-ink">Faucet</h1>
        <span className="size-10" />
      </div>

      <p className="text-center text-[40px] font-bold tracking-tight text-ink">
        ${balance == null ? '—' : formatUsdc(balance)}
      </p>
      <p className="mt-1 text-center text-sm text-muted">MockUSDC balance</p>

      <div className="card-surface mt-6 p-5">
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-gold-soft text-navy">
          <Droplets className="size-5" strokeWidth={1.75} />
        </div>
        <h2 className="text-[17px] font-bold text-ink">Mint demo dollars</h2>
        <p className="mt-1 text-sm text-muted">Fund campaigns without real USDC.</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Amount
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="min-h-12 w-full rounded-2xl bg-bg px-4 text-base font-semibold outline-none focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)]"
          />
        </label>
      </div>

      <div className="sticky bottom-24 mt-4">
        <Button loading={busy} onClick={() => void mint()}>
          Mint to my wallet
        </Button>
      </div>
    </div>
  )
}
