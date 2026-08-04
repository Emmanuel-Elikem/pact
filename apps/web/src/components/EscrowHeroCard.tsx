import { Copy, Check, Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { CampaignStatus } from '../lib/abi'
import { STATUS_LABELS } from '../lib/abi'
import { formatUsdc, truncateAddress } from '../lib/format'

export function EscrowHeroCard({
  amount,
  title,
  status,
  address,
  subtitle,
}: {
  amount: bigint
  title: string
  status: CampaignStatus
  address?: string
  subtitle?: string
}) {
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-escrow relative overflow-hidden p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 size-48 rounded-full bg-indigo-400/20" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <Lock className="size-3.5" strokeWidth={2} />
          </span>
          <span className="text-sm font-medium text-white/90">{title}</span>
        </div>
        <button
          type="button"
          aria-label={hidden ? 'Show amount' : 'Hide amount'}
          onClick={() => setHidden((h) => !h)}
          className="flex size-9 items-center justify-center rounded-full bg-white/10"
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      <p className="relative mt-6 font-sans text-[2rem] font-bold tracking-tight">
        {hidden ? '••••••' : `$${formatUsdc(amount)}`}
      </p>
      <p className="relative mt-1 text-xs text-white/65">
        {subtitle ?? `${STATUS_LABELS[status]} · locked in escrow`}
      </p>

      {address && (
        <div className="relative mt-6 flex items-center justify-between gap-2">
          <p className="font-mono text-sm tracking-wider text-white/90">
            {hidden ? '•••• •••• ••••' : truncateAddress(address, 6)}
          </p>
          <button
            type="button"
            onClick={() => void copy()}
            className="flex size-8 items-center justify-center rounded-full bg-white/10"
            aria-label="Copy address"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      )}
    </motion.div>
  )
}
