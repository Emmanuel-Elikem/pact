import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { useApp } from '../context/AppProvider'
import type { BrandProfile, CreatorCategory, CreatorProfile } from '../lib/types'

const CATEGORIES: CreatorCategory[] = [
  'Tech',
  'Gaming',
  'Fashion',
  'Finance',
  'Lifestyle',
  'Education',
  'Food',
]

export function Welcome() {
  const { role, completeWelcome, saveBrand, saveCreator, brand, creator } = useApp()
  const navigate = useNavigate()

  const [brandForm, setBrandForm] = useState<BrandProfile>({
    ...brand,
    name: brand.name || '',
  })
  const [creatorForm, setCreatorForm] = useState<CreatorProfile>({
    ...creator,
    name: creator.name || '',
  })

  function finish() {
    if (role === 'brand') {
      saveBrand({ ...brandForm, onboarded: true })
    } else {
      saveCreator({ ...creatorForm, onboarded: true })
    }
    completeWelcome(role)
    navigate('/', { replace: true })
  }

  const canFinish =
    role === 'brand'
      ? Boolean(brandForm.name.trim())
      : Boolean(creatorForm.name.trim() && creatorForm.username.trim())

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8e9ed] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-shell w-full !min-h-0 space-y-5 overflow-hidden rounded-[2rem] p-6"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white">
          <BrandMark className="size-7" />
        </div>
        <div>
          <p className="text-sm text-muted">
            {role === 'brand' ? 'Brand setup' : 'Creator setup'} · Trendit
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-ink">
            Tell us about you
          </h1>
          <p className="mt-2 text-sm text-muted">
            {role === 'brand'
              ? 'Quick details so creators know who they’re working with.'
              : 'Quick details so brands can find and select you.'}
          </p>
        </div>

        {role === 'brand' ? (
          <div className="space-y-3">
            <Field
              label="Brand name"
              value={brandForm.name}
              onChange={(v) => setBrandForm({ ...brandForm, name: v })}
            />
            <Field
              label="Website"
              value={brandForm.website}
              onChange={(v) => setBrandForm({ ...brandForm, website: v })}
              placeholder="https://"
            />
            <Field
              label="Industry"
              value={brandForm.industry}
              onChange={(v) => setBrandForm({ ...brandForm, industry: v })}
              placeholder="Food, Fintech, Fashion…"
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                About
              </span>
              <textarea
                value={brandForm.about}
                onChange={(e) => setBrandForm({ ...brandForm, about: e.target.value })}
                rows={3}
                className="w-full rounded-2xl bg-bg px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <Field
              label="Full name"
              value={creatorForm.name}
              onChange={(v) => setCreatorForm({ ...creatorForm, name: v })}
            />
            <Field
              label="Username"
              value={creatorForm.username}
              onChange={(v) => setCreatorForm({ ...creatorForm, username: v })}
              placeholder="@yourname"
            />
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-muted">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCreatorForm({ ...creatorForm, category: c })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                      creatorForm.category === c
                        ? 'bg-navy text-white ring-navy'
                        : 'bg-white text-muted ring-border'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label="TikTok or Instagram"
              value={creatorForm.social.tiktok || ''}
              onChange={(v) =>
                setCreatorForm({
                  ...creatorForm,
                  social: { ...creatorForm.social, tiktok: v },
                })
              }
              placeholder="https://tiktok.com/@…"
            />
          </div>
        )}

        <Button disabled={!canFinish} onClick={finish}>
          Enter {role === 'brand' ? 'brand' : 'creator'} workspace
        </Button>
      </motion.div>
    </div>
  )
}

function Field({
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-2xl bg-bg px-4 text-sm font-semibold outline-none"
      />
    </label>
  )
}
