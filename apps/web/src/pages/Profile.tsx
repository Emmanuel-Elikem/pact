import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Link2 } from 'lucide-react'
import { Button } from '../components/Button'
import { useApp } from '../context/AppProvider'
import { useWallet } from '../context/WalletProvider'
import type { CreatorCategory, CreatorProfile, SocialLinks } from '../lib/types'
import { truncateAddress } from '../lib/format'

const CATEGORIES: CreatorCategory[] = [
  'Tech',
  'Gaming',
  'Fashion',
  'Finance',
  'Lifestyle',
  'Education',
  'Food',
]

const SOCIALS: { key: keyof SocialLinks; label: string; color: string; placeholder: string }[] = [
  { key: 'tiktok', label: 'TikTok', color: '#111111', placeholder: 'https://tiktok.com/@creator' },
  {
    key: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    placeholder: 'https://instagram.com/creator',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    placeholder: 'https://youtube.com/@creator',
  },
  { key: 'x', label: 'X', color: '#0F1419', placeholder: 'https://x.com/creator' },
]

export function Profile() {
  const { role, creator, saveCreator } = useApp()
  const { address } = useWallet()
  const navigate = useNavigate()
  const [form, setForm] = useState<CreatorProfile>(creator)
  const [saved, setSaved] = useState(false)

  if (role !== 'creator') {
    return (
      <div className="card-surface space-y-3 p-5">
        <h1 className="text-[22px] font-bold">Creator profile</h1>
        <p className="text-sm text-muted">
          Open Dashboard and switch to Creator workspace to edit this profile.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  function update<K extends keyof CreatorProfile>(key: K, value: CreatorProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onSave() {
    const next = { ...form, onboarded: Boolean(form.name && form.username) }
    saveCreator(next)
    setSaved(true)
    setTimeout(() => navigate('/campaigns'), 600)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">Creator onboarding</p>
        <h1 className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">Your profile</h1>
      </div>

      <section className="card-surface space-y-3 p-4">
        <h2 className="text-[15px] font-bold">Basic information</h2>
        <Field label="Name" value={form.name} onChange={(v) => update('name', v)} />
        <Field label="Username" value={form.username} onChange={(v) => update('username', v)} />
        <Field
          label="Profile photo URL"
          value={form.photoUrl}
          onChange={(v) => update('photoUrl', v)}
          placeholder="https://…"
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Bio
          </span>
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none"
          />
        </label>
      </section>

      <section className="card-surface space-y-3 p-4">
        <h2 className="text-[15px] font-bold">Creator category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update('category', c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                form.category === c
                  ? 'bg-navy text-white ring-navy'
                  : 'bg-white text-muted ring-border'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="card-surface space-y-3 p-4">
        <h2 className="text-[15px] font-bold">Social connections</h2>
        <p className="text-xs text-muted">MVP: paste profile URLs (OAuth later).</p>
        {SOCIALS.map((s) => (
          <label key={s.key} className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <span
                className="inline-flex size-5 items-center justify-center rounded-full text-[10px] text-white"
                style={{ background: s.color }}
              >
                {s.label[0]}
              </span>
              {s.label}
            </span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={form.social[s.key] || ''}
                onChange={(e) =>
                  update('social', { ...form.social, [s.key]: e.target.value })
                }
                placeholder={s.placeholder}
                className="min-h-12 w-full rounded-2xl bg-bg py-2 pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>
        ))}
      </section>

      <section className="card-surface space-y-3 p-4">
        <h2 className="text-[15px] font-bold">Creator stats</h2>
        <Field
          label="Followers"
          value={String(form.followers || '')}
          onChange={(v) => update('followers', Number(v) || 0)}
          inputMode="numeric"
        />
        <Field
          label="Average views"
          value={String(form.avgViews || '')}
          onChange={(v) => update('avgViews', Number(v) || 0)}
          inputMode="numeric"
        />
        <Field
          label="Engagement rate (%)"
          value={String(form.engagementRate || '')}
          onChange={(v) => update('engagementRate', Number(v) || 0)}
          inputMode="decimal"
        />
      </section>

      <section className="card-surface p-4">
        <h2 className="text-[15px] font-bold">Wallet</h2>
        <p className="mt-1 text-sm text-muted">Connected via Trendit (WaaP / Demo).</p>
        <p className="mt-2 font-mono text-xs font-semibold">{truncateAddress(address, 6)}</p>
      </section>

      <Button onClick={onSave}>
        {saved ? (
          <>
            <Check className="size-4" /> Saved
          </>
        ) : (
          'Save profile'
        )}
      </Button>
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
