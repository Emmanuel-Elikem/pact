export type Role = 'brand' | 'creator'

export type CreatorCategory =
  | 'Tech'
  | 'Gaming'
  | 'Fashion'
  | 'Finance'
  | 'Lifestyle'
  | 'Education'
  | 'Food'

export type CampaignType =
  | 'Product launch'
  | 'Brand awareness'
  | 'App install'
  | 'Event promo'
  | 'Affiliate / sales'
  | 'Education series'

export type SocialLinks = {
  tiktok?: string
  instagram?: string
  youtube?: string
  x?: string
}

export type CreatorProfile = {
  name: string
  username: string
  photoUrl: string
  bio: string
  category: CreatorCategory
  social: SocialLinks
  followers: number
  avgViews: number
  engagementRate: number
  onboarded: boolean
}

export type BrandProfile = {
  name: string
  website: string
  industry: string
  logoUrl: string
  about: string
  onboarded: boolean
}

/** Who can create for this campaign */
export type CreatorSelectionMode = 'open' | 'brand_picks'

/** Full creative brief — stored locally (MVP); escrow $ still on-chain */
export type CampaignBrief = {
  id: string
  source: 'mock' | 'local' | 'chain'
  chainNumericId?: number
  title: string
  brandName: string
  description: string
  campaignType: CampaignType
  category: CreatorCategory
  budgetUsdc: number
  minViews: number
  durationDays: number
  platforms: string[]
  deliverables: string
  hashtags: string
  wantStyle: string
  avoidStyle: string
  talkingPoints: string
  dos: string
  donts: string
  coverImage: string
  assetImages: string[]
  /** open = anyone who applies can submit; brand_picks = brand selects applicants */
  selectionMode: CreatorSelectionMode
  status: 'draft' | 'live' | 'funded' | 'submitted' | 'paid'
  createdAt: number
}

export type CampaignApplicant = {
  campaignId: string
  wallet: string
  name: string
  username: string
  category: string
  followers: number
  avgViews: number
  photoUrl: string
  appliedAt: number
  selected: boolean
}

export type UnifiedCampaign = {
  id: string
  source: 'mock' | 'local' | 'chain'
  chainId?: number
  title: string
  brandName: string
  description: string
  category?: CreatorCategory
  campaignType?: CampaignType
  budgetUsdc: number
  minViews: number
  durationLabel: string
  statusLabel: string
  statusKey: string
  funded: boolean
  coverImage: string
  imageHue: number
}
