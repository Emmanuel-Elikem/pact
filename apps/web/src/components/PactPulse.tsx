import { motion } from 'framer-motion'
import type { CampaignStatus } from '../lib/abi'

const STEPS = ['Created', 'Funded', 'Submitted', 'Measured', 'Paid'] as const

function stepIndex(status: CampaignStatus): number {
  if (status === 6) return -1
  if (status <= 0) return 0
  if (status >= 5) return 4
  return status - 1
}

export function PactPulse({ status, compact }: { status: CampaignStatus; compact?: boolean }) {
  const idx = stepIndex(status)
  const progress = status === 6 ? 0 : (idx + 1) / STEPS.length
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c * (1 - progress)
  const size = compact ? 'size-16' : 'size-24'

  return (
    <div className={`flex items-center gap-4 ${compact ? '' : ''}`}>
      <div className={`relative ${size} shrink-0`}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E8EEF6" strokeWidth="12" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={status === 6 ? '#B42318' : '#0B1F3A'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: status === 6 ? c : offset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-ink">
            {status === 6 ? '↩' : `${Math.round(progress * 100)}%`}
          </span>
        </div>
      </div>
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Escrow progress
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => {
              const active = status !== 6 && i <= idx
              return (
                <span
                  key={label}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    active ? 'bg-navy text-white' : 'bg-navy-soft text-muted'
                  }`}
                >
                  {label}
                </span>
              )
            })}
            {status === 6 && (
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-[10px] font-semibold text-danger">
                Refunded
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
