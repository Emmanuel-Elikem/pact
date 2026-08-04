import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { UnifiedCampaign } from '../lib/types'

export function CampaignCard({
  campaign,
  index = 0,
}: {
  campaign: UnifiedCampaign
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.28 }}
    >
      <Link
        to={`/campaigns/${campaign.id}`}
        className="card-surface block overflow-hidden transition active:scale-[0.99]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-navy-soft">
          {campaign.coverImage ? (
            <img
              src={campaign.coverImage}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="size-full"
              style={{
                background: `linear-gradient(145deg, hsl(${campaign.imageHue} 50% 40%), hsl(${campaign.imageHue + 40} 45% 25%))`,
              }}
            />
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-navy shadow-sm">
            ${campaign.budgetUsdc.toLocaleString()}
          </span>
          <span className="absolute bottom-2 right-2 rounded-full bg-navy/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            {campaign.statusLabel}
          </span>
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">
            {campaign.title}
          </p>
          <p className="truncate text-[11px] text-muted">
            {campaign.brandName}
            {campaign.category ? ` · ${campaign.category}` : ''}
          </p>
          <p className="text-[11px] font-semibold text-accent">
            {campaign.minViews.toLocaleString()} views goal
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function CampaignGrid({
  items,
}: {
  items: UnifiedCampaign[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((c, i) => (
        <CampaignCard key={c.id} campaign={c} index={i} />
      ))}
    </div>
  )
}
