import { formatUnits } from 'ethers'
import { STATUS_LABELS } from './abi'
import { fetchCampaign, fetchCampaignCount } from './contracts'
import { getAddresses } from './addresses'
import { MOCK_BRIEFS, getMockBrief } from './mockCampaigns'
import { getLocalBrief, loadLocalBriefs } from './store'
import type { CampaignBrief, UnifiedCampaign } from './types'

function briefToUnified(b: CampaignBrief): UnifiedCampaign {
  return {
    id: b.id,
    source: b.source === 'chain' ? 'chain' : b.source === 'local' ? 'local' : 'mock',
    chainId: b.chainNumericId,
    title: b.title,
    brandName: b.brandName,
    description: b.description,
    category: b.category,
    campaignType: b.campaignType,
    budgetUsdc: b.budgetUsdc,
    minViews: b.minViews,
    durationLabel: `${b.durationDays} days`,
    statusLabel:
      b.status === 'live' || b.status === 'funded'
        ? 'Open'
        : b.status === 'submitted'
          ? 'In review'
          : b.status === 'paid'
            ? 'Paid'
            : b.status,
    statusKey: b.status,
    funded: b.status === 'live' || b.status === 'funded' || b.status === 'submitted',
    coverImage: b.coverImage,
    imageHue: 210,
  }
}

export function getBrief(id: string): CampaignBrief | undefined {
  return getLocalBrief(id) || getMockBrief(id)
}

export async function loadUnifiedCampaigns(chainId: number): Promise<UnifiedCampaign[]> {
  const local = loadLocalBriefs().map(briefToUnified)
  const mocks = MOCK_BRIEFS.map(briefToUnified)
  const merged = [...local, ...mocks]

  if (!getAddresses(chainId)) return merged

  try {
    const count = await fetchCampaignCount(chainId)
    const onChain: UnifiedCampaign[] = []
    for (let id = count; id >= 1; id--) {
      const c = await fetchCampaign(chainId, id)
      if (c.brand === '0x0000000000000000000000000000000000000000') continue
      const linked = loadLocalBriefs().find((b) => b.chainNumericId === id)
      if (linked) continue
      onChain.push({
        id: `chain-${id}`,
        source: 'chain',
        chainId: id,
        title: `Campaign #${id}`,
        brandName: 'Brand',
        description: 'On-chain funded campaign — open the brief for escrow details.',
        budgetUsdc: Number(formatUnits(c.rewardAmount, 6)),
        minViews: Number(c.minMetric),
        durationLabel: new Date(Number(c.deadline) * 1000).toLocaleDateString(),
        statusLabel: STATUS_LABELS[c.status] ?? 'Unknown',
        statusKey: String(c.status),
        funded: c.funded,
        coverImage:
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
        imageHue: 220,
      })
    }
    return [...onChain, ...merged]
  } catch {
    return merged
  }
}

export function openForCreators(c: UnifiedCampaign) {
  if (c.source === 'chain') return c.statusKey === '2'
  return c.statusKey === 'live' || c.statusKey === 'funded'
}

/** Brands only see campaigns they own (local/on-chain) + demo samples attributed to them */
export async function loadBrandCampaigns(
  chainId: number,
  brandName?: string,
): Promise<UnifiedCampaign[]> {
  const all = await loadUnifiedCampaigns(chainId)
  const mine = all.filter((c) => c.source === 'local' || c.source === 'chain')
  const samples = all
    .filter((c) => c.source === 'mock')
    .slice(0, 4)
    .map((c) => ({
      ...c,
      brandName: brandName?.trim() || c.brandName,
      statusLabel: c.statusLabel === 'Open' ? 'Your campaign' : c.statusLabel,
    }))
  // Prefer real campaigns first; keep a few mock samples so the brand home never feels empty
  const ids = new Set(mine.map((c) => c.id))
  const extras = samples.filter((c) => !ids.has(c.id))
  return [...mine, ...extras]
}

/** Creators see the open marketplace (not brand-private lists) */
export async function loadCreatorMarketplace(chainId: number): Promise<UnifiedCampaign[]> {
  const all = await loadUnifiedCampaigns(chainId)
  return all.filter(openForCreators)
}
