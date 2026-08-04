import { Link } from 'react-router-dom'
import { ChevronRight, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import type { CampaignView } from '../lib/abi'
import { STATUS_LABELS } from '../lib/abi'
import { formatDeadline, formatUsdc, formatViews } from '../lib/format'

export function CampaignCard({
  id,
  campaign,
  index = 0,
}: {
  id: number
  campaign: CampaignView
  index?: number
}) {
  const status = STATUS_LABELS[campaign.status] ?? 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/campaigns/${id}`}
        className="card-surface flex items-center gap-3 p-4 transition active:scale-[0.99]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-navy-soft text-navy">
          <Target className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">Campaign #{id}</p>
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-lg font-bold tracking-tight text-ink">
            ${formatUsdc(campaign.rewardAmount)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {formatViews(campaign.minMetric)} views · {formatDeadline(campaign.deadline)}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
      </Link>
    </motion.div>
  )
}
