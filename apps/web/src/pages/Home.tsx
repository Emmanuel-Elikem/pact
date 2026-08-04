import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Inbox, Plus, RefreshCw } from 'lucide-react'
import { CampaignCard } from '../components/CampaignCard'
import { EscrowHeroCard } from '../components/EscrowHeroCard'
import { Button } from '../components/Button'
import { useWallet } from '../context/WalletProvider'
import { fetchCampaign, fetchCampaignCount } from '../lib/contracts'
import type { CampaignView } from '../lib/abi'
import { getAddresses } from '../lib/addresses'
import { formatUsdc } from '../lib/format'

export function Home() {
  const { chainId, address } = useWallet()
  const [items, setItems] = useState<{ id: number; campaign: CampaignView }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      if (!getAddresses(chainId)) {
        setError('Contracts not configured. Deploy Anvil + set VITE_ANVIL_* env.')
        setItems([])
        return
      }
      const count = await fetchCampaignCount(chainId)
      const next: { id: number; campaign: CampaignView }[] = []
      for (let id = count; id >= 1; id--) {
        const campaign = await fetchCampaign(chainId, id)
        if (campaign.brand !== '0x0000000000000000000000000000000000000000') {
          next.push({ id, campaign })
        }
      }
      setItems(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [chainId])

  const locked = items
    .filter((i) => i.campaign.funded || i.campaign.status === 5)
    .reduce((sum, i) => sum + i.campaign.rewardAmount, 0n)
  const featured = items[0]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">Hello{address ? '' : ''}</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">Your pacts</h1>
      </div>

      <div>
        <p className="text-[40px] font-bold leading-none tracking-tight text-ink">
          ${formatUsdc(locked)}
        </p>
        <p className="mt-1 text-sm text-muted">Total campaign value on-chain</p>
      </div>

      {featured ? (
        <EscrowHeroCard
          amount={featured.campaign.rewardAmount}
          title={`Campaign #${featured.id}`}
          status={featured.campaign.status}
          address={featured.campaign.brand}
          subtitle="Latest campaign · funds locked until delivery"
        />
      ) : (
        <div className="hero-escrow p-5">
          <p className="text-sm text-white/80">No escrow yet</p>
          <p className="mt-3 text-2xl font-bold">Lock a reward</p>
          <p className="mt-1 text-xs text-white/60">
            Create a campaign and fund it — creators get paid when metrics clear.
          </p>
        </div>
      )}

      <Link to="/campaigns/new" className="block">
        <Button>
          <Plus className="size-4" /> Start a campaign
        </Button>
      </Link>

      <div className="flex items-center justify-between pt-1">
        <h2 className="text-[17px] font-bold text-ink">Campaigns</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 text-sm font-semibold text-accent"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      {loading && (
        <div className="card-surface px-4 py-10 text-center text-sm text-muted">Loading…</div>
      )}
      {!loading && error && (
        <div className="rounded-[1.5rem] bg-danger-soft px-4 py-5 text-sm text-danger">{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-surface flex flex-col items-center px-5 py-12 text-center"
        >
          <Inbox className="mb-3 size-9 text-muted" strokeWidth={1.5} />
          <h3 className="text-[17px] font-bold text-ink">No campaigns yet</h3>
          <p className="mt-1 max-w-[16rem] text-sm text-muted">
            Mint MockUSDC from Faucet, then create your first pact.
          </p>
        </motion.div>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <CampaignCard key={item.id} id={item.id} campaign={item.campaign} index={i} />
        ))}
      </div>
    </div>
  )
}
