import { formatUnits, parseUnits } from 'ethers'

export function truncateAddress(addr?: string | null, size = 4): string {
  if (!addr) return '—'
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`
}

export function formatUsdc(amount: bigint): string {
  const n = Number(formatUnits(amount, 6))
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function parseUsdc(value: string): bigint {
  return parseUnits(value || '0', 6)
}

export function formatViews(n: bigint | number): string {
  const v = typeof n === 'bigint' ? Number(n) : n
  return v.toLocaleString()
}

export function formatDeadline(ts: bigint | number): string {
  const ms = (typeof ts === 'bigint' ? Number(ts) : ts) * 1000
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysFromNow(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60
}
