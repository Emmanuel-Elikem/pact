const KEY = 'pact.tiktok'

export type TikTokMock = {
  connected: boolean
  handle: string
  viewCount: number
  likeCount: number
  connectedAt: number
}

export function loadTikTok(campaignId: string): TikTokMock | null {
  try {
    const raw = localStorage.getItem(`${KEY}.${campaignId}`)
    return raw ? (JSON.parse(raw) as TikTokMock) : null
  } catch {
    return null
  }
}

/** Simulate OAuth + return views that clear a typical demo threshold. */
export function connectTikTokMock(campaignId: string, minViews: number): TikTokMock {
  const viewCount = Math.max(minViews, Math.floor(minViews * (1.05 + Math.random() * 0.4)))
  const data: TikTokMock = {
    connected: true,
    handle: '@pact_creator',
    viewCount,
    likeCount: Math.floor(viewCount * 0.08),
    connectedAt: Date.now(),
  }
  localStorage.setItem(`${KEY}.${campaignId}`, JSON.stringify(data))
  return data
}

export function disconnectTikTok(campaignId: string) {
  localStorage.removeItem(`${KEY}.${campaignId}`)
}
