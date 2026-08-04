import type {
  BrandProfile,
  CampaignApplicant,
  CampaignBrief,
  CreatorProfile,
  Role,
} from './types'

const ROLE_KEY = 'pact.role'
const CREATOR_KEY = 'pact.creator.profile'
const BRAND_KEY = 'pact.brand.profile'
const APPLIED_KEY = 'pact.applied'
const APPLICANTS_KEY = 'pact.applicants'
const SUBMISSIONS_KEY = 'pact.submissions'
const BRIEFS_KEY = 'pact.campaign.briefs'
const WELCOME_KEY = 'pact.welcome.done'
const ONBOARDING_KEY = 'pact.onboarding.seen'

export function isOnboardingSeen(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function setOnboardingSeen() {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export type LocalSubmission = {
  campaignId: string
  platform: string
  postUrl: string
  description: string
  screenshotName?: string
  views: number
  likes: number
  shares: number
  status: 'submitted' | 'checking' | 'verified'
  createdAt: number
}

const defaultCreator = (): CreatorProfile => ({
  name: '',
  username: '',
  photoUrl: '',
  bio: '',
  category: 'Lifestyle',
  social: {},
  followers: 0,
  avgViews: 0,
  engagementRate: 0,
  onboarded: false,
})

const defaultBrand = (): BrandProfile => ({
  name: '',
  website: '',
  industry: '',
  logoUrl: '',
  about: '',
  onboarded: false,
})

export function isWelcomeDone(): boolean {
  return localStorage.getItem(WELCOME_KEY) === '1'
}

export function setWelcomeDone() {
  localStorage.setItem(WELCOME_KEY, '1')
}

export function loadRole(): Role {
  const v = localStorage.getItem(ROLE_KEY)
  return v === 'creator' ? 'creator' : 'brand'
}

export function saveRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role)
}

export function loadCreatorProfile(): CreatorProfile {
  try {
    const raw = localStorage.getItem(CREATOR_KEY)
    if (!raw) return defaultCreator()
    return { ...defaultCreator(), ...JSON.parse(raw) }
  } catch {
    return defaultCreator()
  }
}

export function saveCreatorProfile(profile: CreatorProfile) {
  localStorage.setItem(CREATOR_KEY, JSON.stringify(profile))
}

export function loadBrandProfile(): BrandProfile {
  try {
    const raw = localStorage.getItem(BRAND_KEY)
    if (!raw) return defaultBrand()
    return { ...defaultBrand(), ...JSON.parse(raw) }
  } catch {
    return defaultBrand()
  }
}

export function saveBrandProfile(profile: BrandProfile) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(profile))
}

export function loadApplied(): string[] {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

export function loadApplicants(): CampaignApplicant[] {
  try {
    return JSON.parse(localStorage.getItem(APPLICANTS_KEY) || '[]') as CampaignApplicant[]
  } catch {
    return []
  }
}

function saveApplicants(list: CampaignApplicant[]) {
  localStorage.setItem(APPLICANTS_KEY, JSON.stringify(list))
}

export function getApplicantsFor(campaignId: string): CampaignApplicant[] {
  return loadApplicants().filter((a) => a.campaignId === campaignId)
}

export function applyToCampaign(
  campaignId: string,
  creator: {
    wallet: string
    name: string
    username: string
    category: string
    followers: number
    avgViews: number
    photoUrl: string
  },
) {
  const set = new Set(loadApplied())
  set.add(campaignId)
  localStorage.setItem(APPLIED_KEY, JSON.stringify([...set]))

  const all = loadApplicants().filter(
    (a) => !(a.campaignId === campaignId && a.wallet.toLowerCase() === creator.wallet.toLowerCase()),
  )
  all.push({
    campaignId,
    wallet: creator.wallet,
    name: creator.name,
    username: creator.username,
    category: creator.category,
    followers: creator.followers,
    avgViews: creator.avgViews,
    photoUrl: creator.photoUrl,
    appliedAt: Date.now(),
    selected: false,
  })
  saveApplicants(all)
}

export function setApplicantSelected(
  campaignId: string,
  wallet: string,
  selected: boolean,
) {
  const all = loadApplicants().map((a) =>
    a.campaignId === campaignId && a.wallet.toLowerCase() === wallet.toLowerCase()
      ? { ...a, selected }
      : a,
  )
  saveApplicants(all)
}

export function isCreatorSelected(campaignId: string, wallet: string): boolean {
  const a = loadApplicants().find(
    (x) =>
      x.campaignId === campaignId && x.wallet.toLowerCase() === wallet.toLowerCase(),
  )
  return Boolean(a?.selected)
}

export function loadSubmissions(): Record<string, LocalSubmission> {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '{}') as Record<
      string,
      LocalSubmission
    >
  } catch {
    return {}
  }
}

export function saveSubmission(sub: LocalSubmission) {
  const all = loadSubmissions()
  all[sub.campaignId] = sub
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all))
}

export function loadLocalBriefs(): CampaignBrief[] {
  try {
    return JSON.parse(localStorage.getItem(BRIEFS_KEY) || '[]') as CampaignBrief[]
  } catch {
    return []
  }
}

export function saveLocalBrief(brief: CampaignBrief) {
  const all = loadLocalBriefs().filter((b) => b.id !== brief.id)
  all.unshift(brief)
  localStorage.setItem(BRIEFS_KEY, JSON.stringify(all))
}

export function getLocalBrief(id: string): CampaignBrief | undefined {
  return loadLocalBriefs().find((b) => b.id === id)
}

/** Compress image file to data URL for MVP storage */
export function fileToDataUrl(file: File, maxEdge = 1200, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(String(reader.result))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
