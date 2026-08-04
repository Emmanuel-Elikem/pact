import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Link2,
  PartyPopper,
  Play,
  Undo2,
} from 'lucide-react'
import { EscrowHeroCard } from '../components/EscrowHeroCard'
import { PactPulse } from '../components/PactPulse'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { STATUS_LABELS, type CampaignView } from '../lib/abi'
import { explorerTx } from '../lib/chain'
import { fetchCampaign, fetchSubmission, getContracts } from '../lib/contracts'
import {
  formatDeadline,
  formatUsdc,
  formatViews,
  truncateAddress,
} from '../lib/format'
import { connectTikTokMock, loadTikTok, type TikTokMock } from '../lib/tiktok'

export function CampaignDetail() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const { address, chainId, signer } = useWallet()
  const { withTx, push } = useToast()

  const [campaign, setCampaign] = useState<CampaignView | null>(null)
  const [submission, setSubmission] = useState<{
    creator: string
    contentUri: string
    exists: boolean
  } | null>(null)
  const [tiktok, setTiktok] = useState<TikTokMock | null>(null)
  const [contentUri, setContentUri] = useState(
    'https://www.tiktok.com/@pact_creator/video/demo',
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [copiedTx, setCopiedTx] = useState(false)

  const isBrand = useMemo(
    () =>
      !!address &&
      !!campaign &&
      address.toLowerCase() === campaign.brand.toLowerCase(),
    [address, campaign],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const c = await fetchCampaign(chainId, id)
      const s = await fetchSubmission(chainId, id)
      setCampaign(c)
      setSubmission(s)
      setTiktok(loadTikTok(String(id)))
    } finally {
      setLoading(false)
    }
  }, [chainId, id])

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) return
    void reload()
  }, [id, reload])

  async function runTx(label: string, fn: () => Promise<string>) {
    setBusy(true)
    try {
      const hash = await withTx(label, fn)
      setLastTx(hash)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (!Number.isFinite(id) || id < 1) {
    return <p className="text-danger">Invalid campaign</p>
  }

  if (loading || !campaign) {
    return (
      <div className="card-surface px-4 py-12 text-center text-sm text-muted">Loading…</div>
    )
  }

  const paid = campaign.status === 5
  const explorer = lastTx ? explorerTx(chainId, lastTx) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-border"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[17px] font-bold text-ink">Campaign #{id}</h1>
          <p className="text-[11px] uppercase tracking-wide text-muted">
            {formatDeadline(campaign.deadline)}
          </p>
        </div>
        <span className="size-10" />
      </div>

      <p className="text-center text-[40px] font-bold leading-none tracking-tight text-ink">
        ${formatUsdc(campaign.rewardAmount)}
      </p>
      <p className="text-center text-sm text-accent">
        {STATUS_LABELS[campaign.status]}
      </p>

      <EscrowHeroCard
        amount={campaign.rewardAmount}
        title={`${formatUsdc(campaign.rewardAmount)} mUSDC pact`}
        status={campaign.status}
        address={campaign.brand}
        subtitle={`Min ${formatViews(campaign.minMetric)} views · brand ${truncateAddress(campaign.brand)}`}
      />

      <div className="card-surface p-4">
        <PactPulse status={campaign.status} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">Details</h2>
        <span className="text-sm font-semibold text-accent">View rules ›</span>
      </div>

      <div className="card-surface divide-y divide-border overflow-hidden">
        <Row label="Min views" value={formatViews(campaign.minMetric)} />
        <Row label="Deadline" value={formatDeadline(campaign.deadline)} />
        <Row label="Metric" value={formatViews(campaign.metricValue)} />
        {submission?.exists && (
          <Row label="Creator" value={truncateAddress(submission.creator)} />
        )}
      </div>

      {paid && (
        <div className="rounded-[1.5rem] bg-leaf-soft p-5">
          <div className="flex items-center gap-2 text-leaf">
            <PartyPopper className="size-5" />
            <h2 className="text-[17px] font-bold">Payout released</h2>
          </div>
          <p className="mt-2 text-sm text-ink">
            ${formatUsdc(campaign.rewardAmount)} sent to{' '}
            {truncateAddress(submission?.creator)}.
          </p>
        </div>
      )}

      {lastTx && (
        <div className="card-surface flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">Last transaction</p>
            <p className="mt-0.5 truncate font-mono text-xs text-ink">{lastTx}</p>
          </div>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-bg"
            onClick={async () => {
              await navigator.clipboard.writeText(lastTx)
              setCopiedTx(true)
              setTimeout(() => setCopiedTx(false), 1200)
            }}
          >
            {copiedTx ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
          {explorer && (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent"
            >
              Explorer
            </a>
          )}
        </div>
      )}

      {campaign.status === 2 && (
        <section className="card-surface p-4">
          <h3 className="text-[15px] font-bold text-ink">Creator — submit content</h3>
          <p className="mt-1 text-xs text-muted">Anyone can submit once; first wins.</p>
          <input
            value={contentUri}
            onChange={(e) => setContentUri(e.target.value)}
            className="mt-3 min-h-12 w-full rounded-2xl bg-bg px-4 text-sm outline-none"
          />
          <Button
            className="mt-3"
            loading={busy}
            onClick={() =>
              void runTx('Submit content', async () => {
                if (!signer) throw new Error('Connect wallet')
                const { escrow } = getContracts(signer, chainId)
                const tx = await escrow.submitContent(id, contentUri)
                const receipt = await tx.wait()
                return receipt?.hash ?? tx.hash
              })
            }
          >
            <Link2 className="size-4" /> Submit content URL
          </Button>
        </section>
      )}

      {campaign.status >= 3 && campaign.status <= 4 && submission?.exists && (
        <section className="card-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">TikTok metrics</h3>
            <span className="text-[10px] font-semibold uppercase text-muted">Mock</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Simulated OAuth — connected state in localStorage.
          </p>

          {!tiktok?.connected ? (
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => {
                const data = connectTikTokMock(String(id), Number(campaign.minMetric))
                setTiktok(data)
                push({
                  kind: 'success',
                  title: 'TikTok connected (mock)',
                  detail: `${data.handle} · ${formatViews(data.viewCount)} views`,
                })
              }}
            >
              <Play className="size-4" /> Connect TikTok
            </Button>
          ) : (
            <div className="mt-3 rounded-2xl bg-bg px-4 py-3">
              <p className="text-sm font-semibold text-ink">{tiktok.handle}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatViews(tiktok.viewCount)} views · {formatViews(tiktok.likeCount)} likes
              </p>
            </div>
          )}

          {isBrand && campaign.status === 3 && (
            <Button
              className="mt-3"
              loading={busy}
              disabled={!tiktok?.connected}
              onClick={() =>
                void runTx('Record metric + release', async () => {
                  if (!signer || !tiktok) throw new Error('Connect TikTok first')
                  const { escrow } = getContracts(signer, chainId)
                  const recordTx = await escrow.recordMetric(id, BigInt(tiktok.viewCount))
                  await recordTx.wait()
                  const releaseTx = await escrow.releasePayout(id)
                  const receipt = await releaseTx.wait()
                  return receipt?.hash ?? releaseTx.hash
                })
              }
            >
              <CheckCircle2 className="size-4" /> Record & release payout
            </Button>
          )}

          {isBrand && campaign.status === 4 && (
            <Button
              className="mt-3"
              loading={busy}
              disabled={campaign.metricValue < campaign.minMetric}
              onClick={() =>
                void runTx('Release payout', async () => {
                  if (!signer) throw new Error('Connect wallet')
                  const { escrow } = getContracts(signer, chainId)
                  const tx = await escrow.releasePayout(id)
                  const receipt = await tx.wait()
                  return receipt?.hash ?? tx.hash
                })
              }
            >
              Release payout
            </Button>
          )}
        </section>
      )}

      {isBrand &&
        (campaign.status === 2 || campaign.status === 3 || campaign.status === 4) && (
          <Button
            variant="danger"
            loading={busy}
            onClick={() =>
              void runTx('Refund', async () => {
                if (!signer) throw new Error('Connect wallet')
                const { escrow } = getContracts(signer, chainId)
                const tx = await escrow.refund(id)
                const receipt = await tx.wait()
                return receipt?.hash ?? tx.hash
              })
            }
          >
            <Undo2 className="size-4" /> Refund to brand
          </Button>
        )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
