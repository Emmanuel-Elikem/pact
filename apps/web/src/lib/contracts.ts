import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Wallet,
  type Eip1193Provider,
  type Signer,
} from 'ethers'
import { ESCROW_ABI, MOCK_USDC_ABI, type CampaignView } from './abi'
import { getAddresses } from './addresses'
import { defaultChainId, CHAINS } from './chain'

export function readProvider(chainId = defaultChainId()) {
  const rpc = CHAINS[chainId as keyof typeof CHAINS]?.rpcUrl
  if (!rpc) throw new Error('Unsupported chain')
  return new JsonRpcProvider(rpc, chainId)
}

export function getContracts(signerOrProvider: Signer | JsonRpcProvider, chainId: number) {
  const addrs = getAddresses(chainId)
  if (!addrs) throw new Error('Contracts not deployed for this chain. Check addresses / .env')
  const usdc = new Contract(addrs.mockUsdc, MOCK_USDC_ABI, signerOrProvider)
  const escrow = new Contract(addrs.escrow, ESCROW_ABI, signerOrProvider)
  return { usdc, escrow, addrs }
}

export async function browserSigner(eip1193: Eip1193Provider): Promise<{
  provider: BrowserProvider
  signer: Signer
  address: string
  chainId: number
}> {
  const provider = new BrowserProvider(eip1193)
  const signer = await provider.getSigner()
  const network = await provider.getNetwork()
  return {
    provider,
    signer,
    address: await signer.getAddress(),
    chainId: Number(network.chainId),
  }
}

export function demoWallet(privateKey: string, chainId = defaultChainId()) {
  const provider = readProvider(chainId)
  const wallet = new Wallet(privateKey, provider)
  return { provider, signer: wallet as Signer, address: wallet.address, chainId }
}

export async function fetchCampaignCount(chainId: number): Promise<number> {
  const { escrow } = getContracts(readProvider(chainId), chainId)
  const n = await escrow.campaignCount()
  return Number(n)
}

export async function fetchCampaign(chainId: number, id: number): Promise<CampaignView> {
  const { escrow } = getContracts(readProvider(chainId), chainId)
  const c = await escrow.getCampaign(id)
  return {
    brand: c.brand as string,
    rewardAmount: c.rewardAmount as bigint,
    minMetric: c.minMetric as bigint,
    deadline: c.deadline as bigint,
    status: Number(c.status) as CampaignView['status'],
    metricValue: c.metricValue as bigint,
    funded: Boolean(c.funded),
  }
}

export async function fetchSubmission(chainId: number, id: number) {
  const { escrow } = getContracts(readProvider(chainId), chainId)
  const [creator, contentUri, exists] = await escrow.getSubmission(id)
  return {
    creator: creator as string,
    contentUri: contentUri as string,
    exists: Boolean(exists),
  }
}
