import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { CampaignGrid } from '../components/CampaignCard'
import { useApp } from '../context/AppProvider'
import { useWallet } from '../context/WalletProvider'
import { loadBrandCampaigns, loadCreatorMarketplace } from '../lib/campaigns'
import { loadApplied, loadSubmissions, setWelcomeDone } from '../lib/store'
import type { Role, UnifiedCampaign } from '../lib/types'
import { truncateAddress } from '../lib/format'

export function Dashboard() {
  const { role, setRole, creator, brand, completeWelcome } = useApp()
  const { address, chainId, mode } = useWallet()
  const [items, setItems] = useState<UnifiedCampaign[]>([])
  const applied = loadApplied()
  const subs = Object.values(loadSubmissions())

  useEffect(() => {
    if (role === 'brand') {
      void loadBrandCampaigns(chainId, brand.name).then(setItems)
    } else {
      void loadCreatorMarketplace(chainId).then(setItems)
    }
  }, [chainId, role, brand.name])

  const mine = items

  function switchRole(next: Role) {
    setRole(next)
    completeWelcome(next)
    setWelcomeDone()
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">Dashboard</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">
          {role === 'brand' ? brand.name || 'Brand home' : creator.name || 'Creator home'}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {role === 'creator' ? (
          <>
            <Stat label="Applied" value={String(applied.length)} />
            <Stat label="Submissions" value={String(subs.length)} />
          </>
        ) : (
          <>
            <Stat label="Your campaigns" value={String(mine.length)} />
            <Stat label="Live" value={String(mine.filter((c) => c.funded).length)} />
          </>
        )}
      </div>

      <div className="card-surface p-4">
        <p className="text-xs font-semibold text-muted">Signed-in account</p>
        <p className="mt-1 font-mono text-sm">{truncateAddress(address, 6)}</p>
        <p className="mt-1 text-xs text-muted">
          {mode === 'demo' ? 'Demo session' : 'Secure login'} · rewards settle on-chain
        </p>
      </div>

      <div className="card-surface space-y-3 p-4">
        <h2 className="text-[15px] font-bold">Workspace</h2>
        <p className="text-sm text-muted">
          You’re in <strong>{role === 'brand' ? 'Brand' : 'Creator'}</strong> mode. Switch only if
          you need the other experience for the demo.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={role === 'brand' ? 'primary' : 'secondary'}
            onClick={() => switchRole('brand')}
          >
            Brand
          </Button>
          <Button
            variant={role === 'creator' ? 'primary' : 'secondary'}
            onClick={() => switchRole('creator')}
          >
            Creator
          </Button>
        </div>
        {role === 'creator' && !creator.onboarded && (
          <Link to="/profile" className="block text-sm font-semibold text-accent">
            Finish creator profile ›
          </Link>
        )}
      </div>

      {role === 'brand' && (
        <>
          <h2 className="text-[17px] font-bold">Your campaigns</h2>
          {mine.length === 0 ? (
            <p className="text-sm text-muted">Create a campaign to see it here.</p>
          ) : (
            <CampaignGrid items={mine} />
          )}
        </>
      )}

      {role === 'creator' && (
        <>
          <h2 className="text-[17px] font-bold">Your submissions</h2>
          {subs.length === 0 ? (
            <p className="text-sm text-muted">Apply from Campaigns to get started.</p>
          ) : (
            <div className="space-y-2">
              {subs.map((s) => (
                <Link
                  key={s.campaignId}
                  to={`/campaigns/${s.campaignId}`}
                  className="card-surface block px-4 py-3"
                >
                  <p className="text-sm font-semibold">{s.campaignId}</p>
                  <p className="text-xs text-muted">
                    {s.platform} · {s.status} · {s.views.toLocaleString()} views
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface px-4 py-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}
