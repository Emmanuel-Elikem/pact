import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ImagePlus, Sparkles, X } from 'lucide-react'
import { AiChat } from '../components/AiChat'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastProvider'
import { useWallet } from '../context/WalletProvider'
import { useApp } from '../context/AppProvider'
import { clearDraft, loadDraft } from '../lib/ai'
import { getContracts } from '../lib/contracts'
import { daysFromNow, parseUsdc, truncateAddress } from '../lib/format'
import { fileToDataUrl, saveLocalBrief } from '../lib/store'
import type {
  CampaignBrief,
  CampaignType,
  CreatorCategory,
  CreatorSelectionMode,
} from '../lib/types'

const STEPS = ['Brief', 'Creative', 'Assets', 'Fund'] as const
const TYPES: CampaignType[] = [
  'Product launch',
  'Brand awareness',
  'App install',
  'Event promo',
  'Affiliate / sales',
  'Education series',
]
const CATEGORIES: CreatorCategory[] = [
  'Tech',
  'Gaming',
  'Fashion',
  'Finance',
  'Lifestyle',
  'Education',
  'Food',
]
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X']

export function NewCampaign() {
  const { role, brand } = useApp()
  const { signer, chainId, address, mode } = useWallet()
  const { withTx } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [liveId, setLiveId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [campaignType, setCampaignType] = useState<CampaignType>('Product launch')
  const [category, setCategory] = useState<CreatorCategory>('Lifestyle')
  const [reward, setReward] = useState('100')
  const [minViews, setMinViews] = useState('25000')
  const [days, setDays] = useState('7')
  const [platforms, setPlatforms] = useState<string[]>(['TikTok'])
  const [deliverables, setDeliverables] = useState('2 short videos (15–30s)')
  const [hashtags, setHashtags] = useState('')
  const [wantStyle, setWantStyle] = useState('')
  const [avoidStyle, setAvoidStyle] = useState('')
  const [talkingPoints, setTalkingPoints] = useState('')
  const [dos, setDos] = useState('')
  const [donts, setDonts] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [assetImages, setAssetImages] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<CreatorSelectionMode>('brand_picks')
  const [aiOpen, setAiOpen] = useState(false)
  const [nextTips, setNextTips] = useState<string[]>([])

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    setTitle(draft.title || '')
    setDescription(draft.description || '')
    if (draft.campaignType) setCampaignType(draft.campaignType)
    if (draft.category) setCategory(draft.category)
    if (draft.reward) setReward(String(draft.reward))
    if (draft.minViews) setMinViews(String(draft.minViews))
    if (draft.days) setDays(String(draft.days))
    if (draft.platforms?.length) setPlatforms(draft.platforms)
    if (draft.deliverables) setDeliverables(draft.deliverables)
    if (draft.hashtags) setHashtags(draft.hashtags)
    if (draft.wantStyle) setWantStyle(draft.wantStyle)
    if (draft.avoidStyle) setAvoidStyle(draft.avoidStyle)
    if (draft.talkingPoints) setTalkingPoints(draft.talkingPoints)
    if (draft.dos) setDos(draft.dos)
    if (draft.donts) setDonts(draft.donts)
    if (draft.selectionMode) setSelectionMode(draft.selectionMode)
    if (draft.nextTips?.length) setNextTips(draft.nextTips)
    clearDraft()
  }, [])

  if (role !== 'brand') {
    return (
      <div className="card-surface space-y-3 p-5">
        <h1 className="text-[22px] font-bold">Brand workspace</h1>
        <p className="text-sm text-muted">
          Switch to a brand account from Dashboard to launch campaigns.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  async function onCover(file?: File | null) {
    if (!file) return
    setCoverImage(await fileToDataUrl(file))
  }

  async function onAssets(files: FileList | null) {
    if (!files?.length) return
    const next: string[] = []
    for (const f of Array.from(files).slice(0, 6)) {
      next.push(await fileToDataUrl(f, 1000, 0.7))
    }
    setAssetImages((prev) => [...prev, ...next].slice(0, 8))
  }

  function rewardValid(value = reward): boolean {
    const n = Number(value)
    return Number.isFinite(n) && n >= 1
  }

  async function fundAndLaunch() {
    if (!signer || !address) return
    if (!title.trim() || !coverImage) {
      setStep(0)
      return
    }
    if (!rewardValid()) return
    setBusy(true)
    try {
      const rewardAmount = parseUsdc(reward)
      const minMetric = BigInt(minViews.replace(/,/g, '') || '0')
      const deadline = BigInt(daysFromNow(Number(days) || 7))

      const chainNumericId = await withTx('Create campaign', async () => {
        const { escrow } = getContracts(signer, chainId)
        const tx = await escrow.createCampaign(rewardAmount, minMetric, deadline)
        await tx.wait()
        return Number(await escrow.campaignCount())
      })

      await withTx('Lock reward', async () => {
        const { usdc, escrow, addrs } = getContracts(signer, chainId)
        const allowance = await usdc.allowance(address, addrs.escrow)
        if (allowance < rewardAmount) {
          await (await usdc.approve(addrs.escrow, rewardAmount)).wait()
        }
        await (await escrow.fundCampaign(chainNumericId)).wait()
      })

      const brief: CampaignBrief = {
        id: `local-${chainNumericId}-${Date.now()}`,
        source: 'local',
        chainNumericId,
        title,
        brandName: brand.name || 'Brand',
        description,
        campaignType,
        category,
        budgetUsdc: Number(reward) || 0,
        minViews: Number(minViews) || 0,
        durationDays: Number(days) || 7,
        platforms,
        deliverables,
        hashtags,
        wantStyle,
        avoidStyle,
        talkingPoints,
        dos,
        donts,
        coverImage,
        assetImages,
        selectionMode,
        status: 'live',
        createdAt: Date.now(),
      }
      saveLocalBrief(brief)
      setLiveId(brief.id)
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-border"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold">New campaign</h1>
        <span className="size-10" />
      </div>

      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-navy' : 'bg-border'}`} />
            <p
              className={`mt-1 text-center text-[10px] font-semibold ${
                i <= step ? 'text-navy' : 'text-muted'
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Tell creators what this campaign is about — they’ll see every detail.
          </p>
          <Button variant="secondary" onClick={() => setAiOpen(true)}>
            <Sparkles className="size-4" /> Ask AI to draft my campaign
          </Button>
          <Field label="Campaign title" value={title} onChange={setTitle} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none"
              placeholder="What should creators promote and why?"
            />
          </label>
          <ChipSelect
            label="Campaign type"
            options={TYPES}
            value={campaignType}
            onChange={(v) => setCampaignType(v as CampaignType)}
          />
          <ChipSelect
            label="Creator category"
            options={CATEGORIES}
            value={category}
            onChange={(v) => setCategory(v as CreatorCategory)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Reward $" value={reward} onChange={setReward} inputMode="decimal" />
            <Field label="View goal" value={minViews} onChange={setMinViews} inputMode="numeric" />
            <Field label="Days" value={days} onChange={setDays} inputMode="numeric" />
          </div>
          {reward.trim() !== '' && !rewardValid() && (
            <p className="text-sm text-danger">Enter a valid reward of at least $1.</p>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    platforms.includes(p)
                      ? 'bg-navy text-white ring-navy'
                      : 'bg-white text-muted ring-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Field
            label="Deliverables"
            value={deliverables}
            onChange={setDeliverables}
            placeholder="e.g. 2 TikToks + 1 Reel"
          />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted">
              Who can create for you?
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectionMode('brand_picks')}
                className={`w-full rounded-2xl px-4 py-3 text-left ring-1 ${
                  selectionMode === 'brand_picks'
                    ? 'bg-navy-soft ring-navy'
                    : 'bg-white ring-border'
                }`}
              >
                <p className="text-sm font-bold">I choose creators</p>
                <p className="mt-0.5 text-xs text-muted">
                  Creators apply — you pick who joins before they submit.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('open')}
                className={`w-full rounded-2xl px-4 py-3 text-left ring-1 ${
                  selectionMode === 'open' ? 'bg-navy-soft ring-navy' : 'bg-white ring-border'
                }`}
              >
                <p className="text-sm font-bold">Open to anyone</p>
                <p className="mt-0.5 text-xs text-muted">
                  Anyone who applies can submit content right away.
                </p>
              </button>
            </div>
          </div>
          <Button
            disabled={!title.trim() || !description.trim() || !rewardValid()}
            onClick={() => setStep(1)}
          >
            Next: Creative direction
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <Field
            label="Hashtags"
            value={hashtags}
            onChange={setHashtags}
            placeholder="#Brand #Campaign"
          />
          <Area
            label="Style you want"
            value={wantStyle}
            onChange={setWantStyle}
            placeholder="Warm lighting, lifestyle, upbeat audio…"
          />
          <Area
            label="What you don’t want"
            value={avoidStyle}
            onChange={setAvoidStyle}
            placeholder="No competitor logos, no political content…"
          />
          <Area
            label="Talking points"
            value={talkingPoints}
            onChange={setTalkingPoints}
            placeholder="Key messages creators should hit"
          />
          <Area label="Do’s" value={dos} onChange={setDos} placeholder="Show product label…" />
          <Area label="Don’ts" value={donts} onChange={setDonts} placeholder="No fake claims…" />
          <Button onClick={() => setStep(2)}>Next: Photos & assets</Button>
          <button type="button" className="w-full text-sm font-semibold text-muted" onClick={() => setStep(0)}>
            Back
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload a cover photo and any brand assets creators need (logos, product shots, mood).
          </p>
          <label className="card-surface flex cursor-pointer flex-col items-center justify-center gap-2 p-6">
            {coverImage ? (
              <img src={coverImage} alt="" className="max-h-40 w-full rounded-2xl object-cover" />
            ) : (
              <>
                <ImagePlus className="size-8 text-muted" />
                <span className="text-sm font-semibold">Add cover photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onCover(e.target.files?.[0])}
            />
          </label>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Extra assets</p>
            <div className="grid grid-cols-3 gap-2">
              {assetImages.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    onClick={() => setAssetImages((a) => a.filter((_, j) => j !== i))}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl bg-bg text-muted ring-1 ring-border">
                <ImagePlus className="size-5" />
                <span className="mt-1 text-[10px] font-semibold">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void onAssets(e.target.files)}
                />
              </label>
            </div>
          </div>
          <Button disabled={!coverImage} onClick={() => setStep(3)}>
            Next: Lock reward
          </Button>
          <button type="button" className="w-full text-sm font-semibold text-muted" onClick={() => setStep(1)}>
            Back
          </button>
        </div>
      )}

      {step === 3 && !liveId && (
        <div className="space-y-4">
          <div className="card-surface space-y-3 p-5">
            <h2 className="text-[17px] font-bold">Lock your reward</h2>
            <p className="text-sm text-muted">
              Your reward is held safely until creators deliver. Wallet:{' '}
              {truncateAddress(address, 4)}
              {mode === 'demo' ? ' (demo)' : ''}.
            </p>
            <Field
              label="Reward amount ($)"
              value={reward}
              onChange={setReward}
              inputMode="decimal"
              placeholder="100"
            />
            {reward.trim() !== '' && !rewardValid() && (
              <p className="text-sm text-danger">Enter a valid amount of at least $1.</p>
            )}
            {!coverImage && (
              <p className="text-sm text-danger">Add a cover photo before launching.</p>
            )}
          </div>
          <Button
            loading={busy}
            disabled={!coverImage || !rewardValid()}
            onClick={() => void fundAndLaunch()}
          >
            Launch campaign
          </Button>
          <button type="button" className="w-full text-sm font-semibold text-muted" onClick={() => setStep(2)}>
            Back
          </button>
        </div>
      )}

      {step === 3 && liveId && (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-leaf-soft p-5">
            <div className="flex items-center gap-2 text-leaf">
              <Check className="size-5" />
              <h2 className="text-[17px] font-bold">Campaign is live</h2>
            </div>
            <p className="mt-2 text-sm text-ink">
              Creators can now see your brief, photos, and apply.
            </p>
          </div>
          {(nextTips.length
            ? nextTips
            : [
                'Pick creators from applications (or leave it open).',
                'Share the campaign link so creators can find it.',
                'Keep demo dollars topped up from Funds if needed.',
              ]
          ).map((tip) => (
            <p key={tip} className="text-sm text-muted">
              · {tip}
            </p>
          ))}
          <Button onClick={() => navigate(`/campaigns/${liveId}`)}>View campaign</Button>
        </div>
      )}

      <AiChat mode="campaign" open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-h-12 w-full rounded-2xl bg-bg px-4 text-sm font-semibold outline-none"
      />
    </label>
  )
}

function Area({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none"
      />
    </label>
  )
}

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
              value === o ? 'bg-navy text-white ring-navy' : 'bg-white text-muted ring-border'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
