import type { CampaignType, CreatorCategory, CreatorSelectionMode } from './types'

export type CampaignDraft = {
  title: string
  description: string
  campaignType: CampaignType
  category: CreatorCategory
  reward: string
  minViews: string
  days: string
  platforms: string[]
  deliverables: string
  hashtags: string
  wantStyle: string
  avoidStyle: string
  talkingPoints: string
  dos: string
  donts: string
  selectionMode: CreatorSelectionMode
  selectionHint?: string
  nextTips?: string[]
}

export const DRAFT_STORAGE_KEY = 'trendit_campaign_draft'

export async function askAi(opts: {
  message: string
  mode: 'campaign' | 'creator'
  context?: string
}): Promise<{
  reply?: string
  draft?: CampaignDraft
  unavailable?: boolean
  error?: string
}> {
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    const data = (await r.json()) as {
      reply?: string
      draft?: CampaignDraft
      error?: string
      unavailable?: boolean
    }
    if (!r.ok) {
      return {
        error: data.error || 'AI request failed',
        unavailable: data.unavailable || r.status === 503,
      }
    }
    return data
  } catch {
    return { error: 'Could not reach AI', unavailable: true }
  }
}

export function saveDraft(draft: CampaignDraft) {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function loadDraft(): CampaignDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CampaignDraft
  } catch {
    return null
  }
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_STORAGE_KEY)
}
