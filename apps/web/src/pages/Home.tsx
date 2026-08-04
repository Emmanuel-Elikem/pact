import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Rocket, Sparkles, WalletCards } from 'lucide-react'
import { AiChat } from '../components/AiChat'
import { CampaignGrid } from '../components/CampaignCard'
import { Button } from '../components/Button'
import { useApp } from '../context/AppProvider'
import { useWallet } from '../context/WalletProvider'
import { loadBrandCampaigns, loadCreatorMarketplace } from '../lib/campaigns'
import type { UnifiedCampaign } from '../lib/types'

export function Home() {
  const { role, creator, brand } = useApp()
  const { chainId } = useWallet()
  const navigate = useNavigate()
  const [items, setItems] = useState<UnifiedCampaign[]>([])
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    if (role === 'creator') {
      void loadCreatorMarketplace(chainId).then(setItems)
    } else {
      void loadBrandCampaigns(chainId, brand.name).then(setItems)
    }
  }, [chainId, role, brand.name])

  if (role === 'creator') {
    const open = items.slice(0, 6)
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted">Creator</p>
          <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">
            Hi {creator.name.split(' ')[0] || creator.username || 'there'}
          </h1>
        </div>
        <div className="hero-escrow p-5">
          <p className="text-sm text-white/75">Open campaigns</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
          <p className="mt-1 text-xs text-white/60">
            Browse briefs, apply, submit your content, get paid when goals clear.
          </p>
        </div>
        <Button onClick={() => navigate('/campaigns')}>
          Browse campaigns <ArrowRight className="size-4" />
        </Button>
        <Button variant="secondary" onClick={() => setAiOpen(true)}>
          <Sparkles className="size-4" /> Ask AI — how to apply
        </Button>
        <CampaignGrid items={open} />
        <AiChat
          mode="creator"
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          title="Creator tips"
          context="General marketplace advice for Trendit creators."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">Brand · {brand.name || 'Your workspace'}</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">
          Your campaigns
        </h1>
      </div>

      <div className="hero-escrow p-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-white/15">
          <Rocket className="size-5 text-white" />
        </div>
        <p className="mt-3 text-2xl font-bold">Share a brief. Lock a reward.</p>
        <p className="mt-1 text-xs text-white/65">
          Creators apply to your campaigns — you pick who creates, then pay when they deliver.
        </p>
      </div>

      <Button onClick={() => navigate('/campaigns/new')}>
        <Rocket className="size-4" /> Create campaign
      </Button>
      <Button variant="secondary" onClick={() => setAiOpen(true)}>
        <Sparkles className="size-4" /> Ask AI to draft my campaign
      </Button>
      <Button variant="secondary" onClick={() => navigate('/funds')}>
        <WalletCards className="size-4" /> Add demo funds
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">Created by you</h2>
        <Link to="/campaigns" className="text-sm font-semibold text-accent">
          See all ›
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No campaigns yet — create your first one.</p>
      ) : (
        <CampaignGrid items={items.slice(0, 6)} />
      )}

      <AiChat mode="campaign" open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
