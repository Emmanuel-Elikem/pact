import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, Lock } from 'lucide-react'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { getContracts } from '../lib/contracts'
import { daysFromNow, parseUsdc } from '../lib/format'

export function NewCampaign() {
  const { signer, chainId, address } = useWallet()
  const { withTx } = useToast()
  const navigate = useNavigate()
  const [reward, setReward] = useState('50')
  const [minViews, setMinViews] = useState('10000')
  const [days, setDays] = useState('7')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signer || !address) return
    setBusy(true)
    try {
      const rewardAmount = parseUsdc(reward)
      const minMetric = BigInt(minViews.replace(/,/g, '') || '0')
      const deadline = BigInt(daysFromNow(Number(days) || 7))

      const id = await withTx('Create campaign', async () => {
        const { escrow } = getContracts(signer, chainId)
        const tx = await escrow.createCampaign(rewardAmount, minMetric, deadline)
        await tx.wait()
        return Number(await escrow.campaignCount())
      })

      await withTx('Approve + fund escrow', async () => {
        const { usdc, escrow, addrs } = getContracts(signer, chainId)
        const allowance = await usdc.allowance(address, addrs.escrow)
        if (allowance < rewardAmount) {
          const approveTx = await usdc.approve(addrs.escrow, rewardAmount)
          await approveTx.wait()
        }
        const fundTx = await escrow.fundCampaign(id)
        await fundTx.wait()
      })

      navigate(`/campaigns/${id}`)
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
        <h1 className="flex-1 text-center text-[17px] font-bold text-ink">New campaign</h1>
        <span className="size-10" />
      </div>

      <p className="text-center text-[40px] font-bold tracking-tight text-ink">
        ${reward || '0'}
      </p>
      <p className="mt-1 text-center text-sm text-muted">Reward locked until delivery</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
        <div className="card-surface space-y-4 p-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Coins className="size-3.5" /> Reward (mUSDC)
            </span>
            <input
              required
              inputMode="decimal"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-bg px-4 text-base font-semibold text-ink outline-none focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Minimum views
            </span>
            <input
              required
              inputMode="numeric"
              value={minViews}
              onChange={(e) => setMinViews(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-bg px-4 text-base font-semibold text-ink outline-none focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Lock className="size-3.5" /> Deadline (days)
            </span>
            <input
              required
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-bg px-4 text-base font-semibold text-ink outline-none focus:shadow-[0_0_0_3px_rgba(79,70,229,0.2)]"
            />
          </label>
        </div>

        <div className="sticky bottom-24 pt-2">
          <Button type="submit" loading={busy}>
            Create & fund pact
          </Button>
        </div>
      </form>
    </div>
  )
}
