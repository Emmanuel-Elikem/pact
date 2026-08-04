import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { CampaignGrid } from '../components/CampaignCard'
import { Button } from '../components/Button'
import { useApp } from '../context/AppProvider'
import { useWallet } from '../context/WalletProvider'
import { loadBrandCampaigns, loadCreatorMarketplace } from '../lib/campaigns'
import type { UnifiedCampaign } from '../lib/types'

export function Campaigns() {
  const { role, brand } = useApp()
  const { chainId } = useWallet()
  const navigate = useNavigate()
  const [items, setItems] = useState<UnifiedCampaign[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      if (role === 'creator') {
        setItems(await loadCreatorMarketplace(chainId))
      } else {
        setItems(await loadBrandCampaigns(chainId, brand.name))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [chainId, role, brand.name])

  const isBrand = role === 'brand'

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {isBrand ? 'Your workspace' : 'Open for you'}
          </p>
          <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">
            {isBrand ? 'My campaigns' : 'Campaigns'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 text-sm font-semibold text-accent"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      <p className="text-sm text-muted">
        {isBrand
          ? 'Only campaigns you’ve created (plus a few demo samples for the pitch).'
          : 'Tap a card to see the full brief, photos, and rules — then apply.'}
      </p>

      {isBrand && (
        <Button onClick={() => navigate('/campaigns/new')}>
          <Plus className="size-4" /> Create campaign
        </Button>
      )}

      {loading && (
        <div className="card-surface px-4 py-10 text-center text-sm text-muted">Loading…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="card-surface px-4 py-10 text-center text-sm text-muted">
          {isBrand ? 'Create your first campaign to see it here.' : 'No open campaigns right now.'}
        </div>
      )}

      {!loading && items.length > 0 && <CampaignGrid items={items} />}
    </div>
  )
}
