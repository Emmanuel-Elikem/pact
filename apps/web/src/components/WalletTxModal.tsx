import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Shield,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from './Button'
import { truncateAddress } from '../lib/format'

export type WalletTxStatus = 'review' | 'signing' | 'pending' | 'success' | 'error'

export type WalletTxModalProps = {
  open: boolean
  title: string
  description: string
  amountLabel: string
  network?: string
  tokenLabel?: string
  status: WalletTxStatus
  txHash?: string | null
  /** When true, hash is display-only (no explorer link). */
  isMockTx?: boolean
  errorMessage?: string
  confirmLabel?: string
  onConfirm: () => void
  onReject: () => void
  onClose: () => void
}

const NETWORK_DEFAULT = 'Ethereum Sepolia'
const EXPLORER = 'https://sepolia.etherscan.io/tx'

export function mockTxHash(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function WalletTxModal({
  open,
  title,
  description,
  amountLabel,
  network = NETWORK_DEFAULT,
  tokenLabel = 'USDC',
  status,
  txHash,
  isMockTx = false,
  errorMessage,
  confirmLabel = 'Confirm',
  onConfirm,
  onReject,
  onClose,
}: WalletTxModalProps) {
  const [copied, setCopied] = useState(false)
  const busy = status === 'signing' || status === 'pending'
  const canDismiss = status === 'success' || status === 'error'

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function copyHash() {
    if (!txHash) return
    try {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const statusLabel =
    status === 'review'
      ? 'Review transaction'
      : status === 'signing'
        ? 'Confirm in wallet…'
        : status === 'pending'
          ? 'Submitting…'
          : status === 'success'
            ? 'Transaction confirmed'
            : 'Transaction failed'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss overlay"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (status === 'review') onReject()
              else if (canDismiss) onClose()
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-tx-title"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-[28rem] overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_60px_-20px_rgba(11,31,58,0.45)] sm:rounded-[1.75rem]"
          >
            <div className="flex justify-center pt-3 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex items-start gap-3 px-5 pb-2 pt-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-navy text-white">
                <Shield className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Wallet
                </p>
                <h2 id="wallet-tx-title" className="text-[17px] font-bold text-ink">
                  {title}
                </h2>
                <p className="mt-0.5 text-sm text-muted">{description}</p>
              </div>
              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-full bg-bg text-muted"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="mx-5 mt-3 rounded-2xl bg-bg px-4 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Amount
                </span>
                <span className="text-right text-[22px] font-bold tracking-tight text-ink">
                  {amountLabel}
                </span>
              </div>
              <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                <Row label="Token" value={tokenLabel} />
                <Row label="Network" value={network} />
                <Row label="Status" value={statusLabel} accent={status === 'success'} />
              </div>
            </div>

            <div className="px-5 py-4">
              {status === 'signing' && (
                <StatusLine
                  icon={<Loader2 className="size-4 animate-spin text-navy" />}
                  title="Waiting for confirmation"
                  detail="Approve this request in your wallet."
                />
              )}
              {status === 'pending' && (
                <StatusLine
                  icon={<Loader2 className="size-4 animate-spin text-navy" />}
                  title="Broadcasting transaction"
                  detail="Waiting for confirmation on Sepolia…"
                />
              )}
              {status === 'success' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-leaf">
                    <CheckCircle2 className="size-5" />
                    <p className="text-sm font-bold">Confirmed on Sepolia</p>
                  </div>
                  {txHash && (
                    <div className="rounded-2xl bg-leaf-soft/60 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Transaction hash
                      </p>
                      <p className="mt-1 break-all font-mono text-xs font-semibold text-ink">
                        {txHash}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyHash()}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-border"
                        >
                          <Copy className="size-3.5" />
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        {!isMockTx && (
                          <a
                            href={`${EXPLORER}/${txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-border"
                          >
                            <ExternalLink className="size-3.5" />
                            View on explorer
                          </a>
                        )}
                      </div>
                      {isMockTx && (
                        <p className="mt-2 text-[11px] text-muted">
                          Receipt recorded · {truncateAddress(txHash, 6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {status === 'error' && (
                <div className="flex gap-2 text-danger">
                  <XCircle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Could not complete</p>
                    <p className="mt-0.5 text-xs text-danger/90">
                      {errorMessage || 'Transaction was rejected or failed.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {status === 'review' && (
                <>
                  <Button onClick={onConfirm}>{confirmLabel}</Button>
                  <Button variant="secondary" onClick={onReject}>
                    Reject
                  </Button>
                </>
              )}
              {busy && (
                <Button disabled loading>
                  {status === 'signing' ? 'Confirm in wallet…' : 'Submitting…'}
                </Button>
              )}
              {status === 'success' && (
                <Button onClick={onClose}>Done</Button>
              )}
              {status === 'error' && (
                <>
                  <Button onClick={onConfirm}>Try again</Button>
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${accent ? 'text-leaf' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function StatusLine({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode
  title: string
  detail: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-navy-soft/70 px-3 py-3">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </div>
  )
}
