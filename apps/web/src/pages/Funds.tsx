import { useEffect, useState } from 'react'
import { CheckCircle2, Coins, Sparkles } from 'lucide-react'
import { formatEther, parseEther } from 'ethers'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { getContracts, readProvider } from '../lib/contracts'
import { formatUsdc, parseUsdc, truncateAddress } from '../lib/format'

/** Friendly “top up” page — formerly faucet */
export function Funds() {
  const { signer, chainId, address } = useWallet()
  const { withTx, push } = useToast()
  const [ethBal, setEthBal] = useState<string>('—')
  const [usdcBal, setUsdcBal] = useState<string>('—')
  const [busy, setBusy] = useState<'gas' | 'reward' | null>(null)
  const [last, setLast] = useState<string | null>(null)

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

  async function getGasHelp() {
    if (!signer || !address) return
    setBusy('gas')
    try {
      await withTx('Confirm network access', async () => {
        const tx = await signer.sendTransaction({ to: address, value: parseEther('0') })
        await tx.wait()
      })
      setLast('Network access confirmed. Demo accounts already include spending balance.')
      push({
        kind: 'success',
        title: 'Ready to go',
        detail: 'You can create and fund campaigns.',
      })
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  async function getRewardTokens() {
    if (!signer || !address) return
    setBusy('reward')
    try {
      await withTx('Add demo reward balance', async () => {
        const { usdc } = getContracts(signer, chainId)
        await (await usdc.mint(address, parseUsdc('100'))).wait()
      })
      setLast('Added 100 demo dollars to your balance.')
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">For testing</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">Add demo funds</h1>
      </div>
      <p className="text-sm text-muted">
        Grab practice balance so you can try launching campaigns. This is demo money — not real
        cash.
      </p>

      <div className="card-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your account</p>
        <p className="mt-1 font-mono text-sm font-semibold text-ink">
          {address ? truncateAddress(address, 6) : '—'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-bg px-3 py-3">
            <p className="text-[11px] text-muted">Network balance</p>
            <p className="text-lg font-bold">{ethBal}</p>
          </div>
          <div className="rounded-2xl bg-bg px-3 py-3">
            <p className="text-[11px] text-muted">Campaign dollars</p>
            <p className="text-lg font-bold">${usdcBal}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button loading={busy === 'gas'} onClick={() => void getGasHelp()}>
          <Sparkles className="size-4" /> Check network access
        </Button>
        <Button variant="secondary" loading={busy === 'reward'} onClick={() => void getRewardTokens()}>
          <Coins className="size-4" /> Get 100 demo dollars
        </Button>
      </div>

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
