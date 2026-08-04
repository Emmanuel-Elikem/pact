import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, X } from 'lucide-react'
import { Button } from './Button'
import { askAi, saveDraft, type CampaignDraft } from '../lib/ai'

type Props = {
  mode: 'campaign' | 'creator'
  open: boolean
  onClose: () => void
  /** Extra context for creator tips (campaign title/brief) */
  context?: string
  title?: string
}

export function AiChat({ mode, open, onClose, context, title }: Props) {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [reply, setReply] = useState<string | null>(null)
  const [draft, setDraft] = useState<CampaignDraft | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function send() {
    const message = input.trim()
    if (!message || busy) return
    setBusy(true)
    setError(null)
    setReply(null)
    setDraft(null)
    try {
      const res = await askAi({ message, mode, context })
      if (res.unavailable || res.error) {
        setError(
          res.error ||
            'AI unavailable — set GEMINI_API_KEY on the server.',
        )
        return
      }
      if (res.draft) setDraft(res.draft)
      setReply(res.reply || (mode === 'creator' ? 'No tips returned.' : 'Draft ready.'))
    } finally {
      setBusy(false)
    }
  }

  function useDraft() {
    if (!draft) return
    saveDraft(draft)
    onClose()
    navigate('/campaigns/new')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
      <div className="card-surface flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden shadow-[0_24px_80px_-40px_rgba(11,31,58,0.5)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-navy" />
            <h2 className="text-[15px] font-bold">
              {title || (mode === 'campaign' ? 'Campaign Manager' : 'Ask AI')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-bg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <p className="text-sm text-muted">
            {mode === 'campaign'
              ? 'Describe your brand, product, and goal. I’ll draft a campaign you can edit.'
              : 'Ask how to apply or what to submit for this campaign.'}
          </p>

          {error && (
            <div className="rounded-2xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          {reply && (
            <div className="rounded-2xl bg-bg px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap text-ink">
              {reply}
            </div>
          )}

          {draft && (
            <div className="space-y-2 rounded-2xl bg-navy-soft px-3 py-3 text-sm">
              <p className="font-bold text-navy">{draft.title}</p>
              <p className="text-xs text-muted line-clamp-3">{draft.description}</p>
              <p className="text-xs text-muted">
                ${draft.reward} · {draft.days} days · {draft.minViews} views ·{' '}
                {draft.selectionMode === 'brand_picks' ? 'You pick creators' : 'Open'}
              </p>
              {draft.selectionHint && (
                <p className="text-xs text-ink">{draft.selectionHint}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-border px-4 py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder={
              mode === 'campaign'
                ? 'e.g. We’re a skincare startup launching a SPF mist…'
                : 'e.g. What should I include when I apply?'
            }
            className="w-full rounded-2xl bg-bg px-3 py-2.5 text-sm outline-none"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              loading={busy}
              disabled={!input.trim()}
              onClick={() => void send()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Ask AI
                </>
              )}
            </Button>
            {draft && (
              <Button variant="secondary" className="flex-1" onClick={useDraft}>
                Use this draft
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
