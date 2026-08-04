import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Link2,
  Loader2,
  PartyPopper,
  Play,
  Undo2,
} from 'lucide-react'
import { Button } from '../components/Button'
import { EscrowHeroCard } from '../components/EscrowHeroCard'
import { PactPulse } from '../components/PactPulse'
import { useApp } from '../context/AppProvider'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { STATUS_LABELS, type CampaignView } from '../lib/abi'
import { getBrief } from '../lib/campaigns'
import { fetchCampaign, fetchSubmission, getContracts } from '../lib/contracts'
import { formatUsdc, formatViews, truncateAddress } from '../lib/format'
import {
  applyToCampaign,
  getApplicantsFor,
  isCreatorSelected,
  loadApplied,
  loadSubmissions,
  saveSubmission,
  setApplicantSelected,
  type LocalSubmission,
} from '../lib/store'
import { connectTikTokMock, loadTikTok, type TikTokMock } from '../lib/tiktok'
import type { CampaignApplicant, CampaignBrief } from '../lib/types'

export function CampaignDetail() {
  const { id: idParam = '' } = useParams()
  const brief = getBrief(idParam)
  if (brief) return <BriefCampaignDetail brief={brief} />
  if (idParam.startsWith('chain-')) {
    const n = Number(idParam.replace('chain-', ''))
    if (Number.isFinite(n)) return <ChainCampaignDetail id={n} />
  }
  return <p className="text-danger">Campaign not found</p>
}

function BriefCampaignDetail({ brief }: { brief: CampaignBrief }) {
  const { role, creator } = useApp()
  const navigate = useNavigate()
  const { signer, chainId, address } = useWallet()
  const { withTx, push } = useToast()
  const [applied, setApplied] = useState(() => loadApplied().includes(brief.id))
  const [applicants, setApplicants] = useState(() => getApplicantsFor(brief.id))
  const [sub, setSub] = useState<LocalSubmission | undefined>(
    () => loadSubmissions()[brief.id],
  )
  const [platform, setPlatform] = useState(brief.platforms[0] || 'TikTok')
  const [postUrl, setPostUrl] = useState('https://www.tiktok.com/@creator/video/demo')
  const [description, setDescription] = useState('')
  const [screenshotName, setScreenshotName] = useState('')
  const [checking, setChecking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [chain, setChain] = useState<CampaignView | null>(null)

  const mode = brief.selectionMode || 'open'
  const selected =
    !!address && (mode === 'open' || isCreatorSelected(brief.id, address))
  const canSubmit = applied && (mode === 'open' || selected)

  useEffect(() => {
    if (brief.chainNumericId == null) return
    void fetchCampaign(chainId, brief.chainNumericId).then(setChain).catch(() => null)
  }, [brief.chainNumericId, chainId])

  const progress =
    sub?.status === 'verified' ? 100 : sub?.status === 'checking' ? 70 : sub ? 55 : applied ? 30 : 15

  function onApply() {
    if (!address) return
    applyToCampaign(brief.id, {
      wallet: address,
      name: creator.name || 'Creator',
      username: creator.username || truncateAddress(address),
      category: creator.category,
      followers: creator.followers,
      avgViews: creator.avgViews,
      photoUrl: creator.photoUrl,
    })
    setApplied(true)
    setApplicants(getApplicantsFor(brief.id))
    push({
      kind: 'success',
      title: 'Application sent',
      detail:
        mode === 'brand_picks'
          ? 'The brand will review and may select you.'
          : 'You can submit your content now.',
    })
  }

  function toggleSelect(a: CampaignApplicant) {
    setApplicantSelected(brief.id, a.wallet, !a.selected)
    setApplicants(getApplicantsFor(brief.id))
  }

  function onSubmitContent() {
    const draft: LocalSubmission = {
      campaignId: brief.id,
      platform,
      postUrl,
      description,
      screenshotName,
      views: 0,
      likes: 0,
      shares: 0,
      status: 'submitted',
      createdAt: Date.now(),
    }
    saveSubmission(draft)
    setSub(draft)
    setChecking(true)

    // If linked on-chain, also submit URI via ethers
    if (brief.chainNumericId != null && signer) {
      void (async () => {
        setBusy(true)
        try {
          await withTx('Submit content', async () => {
            const { escrow } = getContracts(signer, chainId)
            const tx = await escrow.submitContent(brief.chainNumericId!, postUrl)
            const receipt = await tx.wait()
            return receipt?.hash ?? tx.hash
          })
        } catch {
          /* keep local demo path */
        } finally {
          setBusy(false)
        }
      })()
    }

    setTimeout(() => {
      const verified: LocalSubmission = {
        ...draft,
        status: 'verified',
        views: Math.max(brief.minViews, 52340),
        likes: 4230,
        shares: 820,
      }
      saveSubmission(verified)
      setSub(verified)
      setChecking(false)
      push({
        kind: 'success',
        title: 'Metrics checked',
        detail: `${verified.views.toLocaleString()} views`,
      })
    }, 1600)
  }

  return (
    <div className="space-y-4">
      <Header title={brief.title} onBack={() => navigate(-1)} />

      <div className="overflow-hidden rounded-[1.75rem]">
        <img src={brief.coverImage} alt="" className="aspect-[16/10] w-full object-cover" />
      </div>

      <p className="text-center text-[40px] font-bold tracking-tight">
        ${brief.budgetUsdc.toLocaleString()}
      </p>
      <p className="text-center text-sm text-accent">
        {brief.brandName} · {brief.campaignType}
      </p>

      <p className="text-sm leading-relaxed text-ink">{brief.description}</p>

      {brief.assetImages.length > 0 && (
        <div>
          <h2 className="mb-2 text-[15px] font-bold">Brand assets</h2>
          <div className="grid grid-cols-2 gap-2">
            {brief.assetImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>
      )}

      <section className="card-surface divide-y divide-border overflow-hidden">
        <Row label="Category" value={brief.category} />
        <Row label="Platforms" value={brief.platforms.join(', ')} />
        <Row label="Deliverables" value={brief.deliverables} />
        <Row label="View goal" value={brief.minViews.toLocaleString()} />
        <Row label="Duration" value={`${brief.durationDays} days`} />
        <Row
          label="Creators"
          value={mode === 'brand_picks' ? 'Brand picks applicants' : 'Open — anyone can submit'}
        />
        {brief.hashtags && <Row label="Hashtags" value={brief.hashtags} />}
      </section>

      <BriefBlock title="Style we want" body={brief.wantStyle} />
      <BriefBlock title="Please avoid" body={brief.avoidStyle} />
      <BriefBlock title="Talking points" body={brief.talkingPoints} />
      <BriefBlock title="Do’s" body={brief.dos} />
      <BriefBlock title="Don’ts" body={brief.donts} />

      {chain && (
        <div className="card-surface p-4">
          <p className="text-xs font-semibold text-muted">On-chain status</p>
          <p className="mt-1 text-sm font-bold">{STATUS_LABELS[chain.status]}</p>
          <p className="text-xs text-muted">
            Reward locked · brand {truncateAddress(chain.brand)}
            {address ? ` · you ${truncateAddress(address)}` : ''}
          </p>
        </div>
      )}

      <ProgressCard
        label={
          sub?.status === 'verified'
            ? 'Verified'
            : sub
              ? 'Content submitted'
              : applied
                ? 'Applied'
                : 'Open'
        }
        progress={progress}
      />

      {role === 'brand' && (
        <section className="card-surface space-y-3 p-4">
          <h3 className="text-[15px] font-bold">Creator applications</h3>
          <p className="text-xs text-muted">
            {mode === 'brand_picks'
              ? 'Select who should create for this campaign. Only selected creators can submit.'
              : 'This campaign is open — applicants can submit without approval.'}
          </p>
          {applicants.length === 0 ? (
            <p className="text-sm text-muted">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {applicants.map((a) => (
                <div
                  key={a.wallet}
                  className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-3"
                >
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-navy-soft text-sm font-bold text-navy">
                    {a.photoUrl ? (
                      <img src={a.photoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      (a.name || '?')[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-muted">
                      @{a.username} · {a.followers.toLocaleString()} followers ·{' '}
                      {a.avgViews.toLocaleString()} avg views
                    </p>
                  </div>
                  {mode === 'brand_picks' ? (
                    <button
                      type="button"
                      onClick={() => toggleSelect(a)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                        a.selected ? 'bg-leaf text-white' : 'bg-white text-navy ring-1 ring-border'
                      }`}
                    >
                      {a.selected ? 'Selected' : 'Select'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-muted">Applied</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {role === 'creator' && !applied && (
        <Button onClick={onApply}>I want to join this campaign</Button>
      )}

      {role === 'creator' && applied && !canSubmit && (
        <div className="card-surface p-4">
          <p className="text-sm font-semibold text-ink">Application received</p>
          <p className="mt-1 text-sm text-muted">
            The brand is reviewing creators. You’ll be able to submit once they select you.
          </p>
        </div>
      )}

      {role === 'creator' && canSubmit && (
        <section className="card-surface space-y-3 p-4">
          <h3 className="text-[15px] font-bold">Submit your content</h3>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Platform</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-bg px-4 text-sm font-semibold"
            >
              {(brief.platforms.length ? brief.platforms : ['TikTok', 'Instagram']).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Post URL</span>
            <input
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-bg px-4 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              Screenshot (optional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshotName(e.target.files?.[0]?.name || '')}
              className="block w-full text-xs text-muted"
            />
            {screenshotName && <p className="mt-1 text-xs">{screenshotName}</p>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Notes</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl bg-bg px-4 py-3 text-sm"
            />
          </label>
          <Button
            loading={busy || checking}
            disabled={sub?.status === 'verified'}
            onClick={onSubmitContent}
          >
            <Link2 className="size-4" /> Submit
          </Button>
        </section>
      )}

      {(checking || sub) && (
        <section className="card-surface space-y-3 p-4">
          <h3 className="text-[15px] font-bold">Checking your post</h3>
          {checking ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Checking metrics…
            </p>
          ) : (
            <>
              <Row label="Views" value={sub!.views.toLocaleString()} />
              <Row label="Likes" value={sub!.likes.toLocaleString()} />
              <Row label="Shares" value={sub!.shares.toLocaleString()} />
              <div className="flex items-center gap-2 text-leaf">
                <CheckCircle2 className="size-4" />
                <span className="text-sm font-bold">Verified</span>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

function ChainCampaignDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { role } = useApp()
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
      setCampaign(await fetchCampaign(chainId, id))
      setSubmission(await fetchSubmission(chainId, id))
      setTiktok(loadTikTok(String(id)))
    } finally {
      setLoading(false)
    }
  }, [chainId, id])

  useEffect(() => {
    void reload()
  }, [reload])

  async function runTx(label: string, fn: () => Promise<string>) {
    setBusy(true)
    try {
      await withTx(label, fn)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading || !campaign) {
    return <div className="card-surface px-4 py-12 text-center text-sm text-muted">Loading…</div>
  }

  const paid = campaign.status === 5

  return (
    <div className="space-y-4">
      <Header title={`Campaign #${id}`} onBack={() => navigate(-1)} />
      <p className="text-center text-[40px] font-bold tracking-tight">
        ${formatUsdc(campaign.rewardAmount)}
      </p>
      <p className="text-center text-sm text-accent">{STATUS_LABELS[campaign.status]}</p>

      <EscrowHeroCard
        amount={campaign.rewardAmount}
        title={`${formatUsdc(campaign.rewardAmount)} locked`}
        status={campaign.status}
        address={campaign.brand}
        subtitle={`Min ${formatViews(campaign.minMetric)} views`}
      />
      <div className="card-surface p-4">
        <PactPulse status={campaign.status} />
      </div>

      {paid && (
        <div className="rounded-[1.5rem] bg-leaf-soft p-5">
          <div className="flex items-center gap-2 text-leaf">
            <PartyPopper className="size-5" />
            <h2 className="text-[17px] font-bold">Payment sent</h2>
          </div>
          <p className="mt-2 text-sm">
            ${formatUsdc(campaign.rewardAmount)} → {truncateAddress(submission?.creator)}
          </p>
        </div>
      )}

      {campaign.status === 2 && role === 'creator' && (
        <section className="card-surface space-y-3 p-4">
          <h3 className="text-[15px] font-bold">Submit content</h3>
          <input
            value={contentUri}
            onChange={(e) => setContentUri(e.target.value)}
            className="min-h-12 w-full rounded-2xl bg-bg px-4 text-sm"
          />
          <Button
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
            <Link2 className="size-4" /> Submit post link
          </Button>
        </section>
      )}

      {campaign.status >= 3 && campaign.status <= 4 && submission?.exists && (
        <section className="card-surface space-y-3 p-4">
          <h3 className="text-[15px] font-bold">Performance check</h3>
          {!tiktok?.connected ? (
            <Button
              variant="secondary"
              onClick={() => {
                const data = connectTikTokMock(String(id), Number(campaign.minMetric))
                setTiktok(data)
                push({
                  kind: 'success',
                  title: 'Connected',
                  detail: `${formatViews(data.viewCount)} views`,
                })
              }}
            >
              <Play className="size-4" /> Connect social account
            </Button>
          ) : (
            <div className="rounded-2xl bg-bg px-4 py-3 text-sm">
              <p className="font-semibold">{tiktok.handle}</p>
              <p className="text-xs text-muted">
                Views {formatViews(tiktok.viewCount)} · Likes {formatViews(tiktok.likeCount)}
              </p>
            </div>
          )}
          {isBrand && campaign.status === 3 && (
            <Button
              loading={busy}
              disabled={!tiktok?.connected}
              onClick={() =>
                void runTx('Release payment', async () => {
                  if (!signer || !tiktok) throw new Error('Connect social first')
                  const { escrow } = getContracts(signer, chainId)
                  await (await escrow.recordMetric(id, BigInt(tiktok.viewCount))).wait()
                  const releaseTx = await escrow.releasePayout(id)
                  const receipt = await releaseTx.wait()
                  return receipt?.hash ?? releaseTx.hash
                })
              }
            >
              <CheckCircle2 className="size-4" /> Release payment
            </Button>
          )}
        </section>
      )}

      {isBrand && campaign.status >= 2 && campaign.status <= 4 && (
        <Button
          variant="danger"
          loading={busy}
          onClick={() =>
            void runTx('Return funds', async () => {
              if (!signer) throw new Error('Connect wallet')
              const { escrow } = getContracts(signer, chainId)
              const tx = await escrow.refund(id)
              const receipt = await tx.wait()
              return receipt?.hash ?? tx.hash
            })
          }
        >
          <Undo2 className="size-4" /> Return funds to brand
        </Button>
      )}
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-border"
        aria-label="Back"
      >
        <ArrowLeft className="size-4" />
      </button>
      <h1 className="flex-1 truncate text-center text-[17px] font-bold">{title}</h1>
      <span className="size-10" />
    </div>
  )
}

function BriefBlock({ title, body }: { title: string; body: string }) {
  if (!body?.trim()) return null
  return (
    <section className="card-surface p-4">
      <h3 className="text-[15px] font-bold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{body}</p>
    </section>
  )
}

function ProgressCard({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Progress</span>
        <span className="text-accent">{label}</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-navy transition-all"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
