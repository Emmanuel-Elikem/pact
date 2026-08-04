import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Contract, JsonRpcProvider, Wallet, getAddress, isAddress } from 'ethers'

const MINT_AMOUNT = 1_000_000_000n // 1000 MockUSDC (6 decimals)
const MOCK_USDC_ABI = ['function mint(address to, uint256 amount)'] as const

/** Simple in-memory rate limit: 1 mint / address / 60s (resets on cold start). */
const lastMint = new Map<string, number>()
const COOLDOWN_MS = 60_000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const pk = process.env.FAUCET_PRIVATE_KEY
  if (!pk) {
    return res.status(503).json({
      error: 'Faucet unavailable — set FAUCET_PRIVATE_KEY',
      unavailable: true,
    })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  const raw = String(body.address || '').trim()
  if (!isAddress(raw)) {
    return res.status(400).json({ error: 'Valid wallet address required' })
  }

  let to: string
  try {
    to = getAddress(raw)
  } catch {
    return res.status(400).json({ error: 'Invalid checksum address' })
  }

  const now = Date.now()
  const prev = lastMint.get(to.toLowerCase()) || 0
  if (now - prev < COOLDOWN_MS) {
    return res.status(429).json({
      error: 'Please wait a minute before requesting more demo funds.',
    })
  }

  const chainId = Number(body.chainId || process.env.VITE_CHAIN_ID || 11155111)
  const rpc =
    (chainId === 84532
      ? process.env.VITE_BASE_SEPOLIA_RPC
      : process.env.VITE_SEPOLIA_RPC) ||
    process.env.SEPOLIA_RPC_URL ||
    'https://ethereum-sepolia-rpc.publicnode.com'

  const usdcAddr =
    (chainId === 84532
      ? process.env.VITE_BASE_SEPOLIA_USDC
      : process.env.VITE_SEPOLIA_USDC) ||
    (chainId === 84532
      ? '0xF07Ac92C88d2fDF634B7e20836E7E38De8EBACd2'
      : '0x3AB4a2df7b5FF19B142B401334B4Dd3142545cDe')

  try {
    const provider = new JsonRpcProvider(rpc, chainId)
    const wallet = new Wallet(pk, provider)
    const usdc = new Contract(usdcAddr, MOCK_USDC_ABI, wallet)
    const tx = await usdc.mint(to, MINT_AMOUNT)
    const receipt = await tx.wait()
    lastMint.set(to.toLowerCase(), now)
    return res.status(200).json({
      ok: true,
      amount: '1000',
      to,
      txHash: receipt?.hash ?? tx.hash,
      chainId,
    })
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Mint failed',
    })
  }
}
