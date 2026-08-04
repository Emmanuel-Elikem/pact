export const MOCK_USDC_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
] as const

export const ESCROW_ABI = [
  'function nextCampaignId() view returns (uint256)',
  'function campaignCount() view returns (uint256)',
  'function oracle() view returns (address)',
  'function usdc() view returns (address)',
  'function createCampaign(uint256 rewardAmount, uint256 minMetric, uint64 deadline) returns (uint256)',
  'function fundCampaign(uint256 id)',
  'function submitContent(uint256 id, string contentUri)',
  'function recordMetric(uint256 id, uint256 metricValue)',
  'function releasePayout(uint256 id)',
  'function refund(uint256 id)',
  'function getCampaign(uint256 id) view returns (tuple(address brand, uint256 rewardAmount, uint256 minMetric, uint64 deadline, uint8 status, uint256 metricValue, bool funded))',
  'function getSubmission(uint256 id) view returns (address creator, string contentUri, bool exists)',
  'event CampaignCreated(uint256 indexed id, address indexed brand, uint256 rewardAmount, uint256 minMetric, uint64 deadline)',
  'event CampaignFunded(uint256 indexed id, uint256 amount)',
  'event ContentSubmitted(uint256 indexed id, address indexed creator, string contentUri)',
  'event MetricRecorded(uint256 indexed id, uint256 metricValue)',
  'event PayoutReleased(uint256 indexed id, address indexed creator, uint256 amount)',
  'event Refunded(uint256 indexed id, address indexed brand, uint256 amount)',
] as const

export const STATUS_LABELS = [
  'None',
  'Created',
  'Funded',
  'Submitted',
  'Measured',
  'Paid',
  'Refunded',
] as const

export type CampaignStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CampaignView = {
  brand: string
  rewardAmount: bigint
  minMetric: bigint
  deadline: bigint
  status: CampaignStatus
  metricValue: bigint
  funded: boolean
}
