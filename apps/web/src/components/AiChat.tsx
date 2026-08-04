import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Mic, MicOff, Sparkles, Volume2, X } from 'lucide-react'
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

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionResultEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function AiChat({ mode, open, onClose, context, title }: Props) {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [reply, setReply] = useState<string | null>(null)
  const [draft, setDraft] = useState<CampaignDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const autoSendRef = useRef(false)

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionCtor()))
  }, [])

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.abort()
      recognitionRef.current = null
      setListening(false)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setSpeaking(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  async function send(messageOverride?: string) {
    const message = (messageOverride ?? input).trim()
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

  function toggleListening() {
    if (!voiceSupported || busy) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    autoSendRef.current = false

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      const trimmed = transcript.trim()
      if (!trimmed) return
      setInput(trimmed)

      const last = event.results[event.results.length - 1]
      if (last?.isFinal && !autoSendRef.current) {
        autoSendRef.current = true
        recognition.stop()
        void send(trimmed)
      }
    }

    recognition.onerror = (event) => {
      setListening(false)
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Allow mic access to use voice.')
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError('Voice input failed. Try typing instead.')
      }
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      setError(null)
    } catch {
      setListening(false)
      setError('Could not start voice input. Try again.')
    }
  }

  function speakReply() {
    if (!reply || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(reply)
    utter.lang = 'en-US'
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utter)
  }

  if (!open) return null

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
            <div className="space-y-2">
              <div className="rounded-2xl bg-bg px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                {reply}
              </div>
              {'speechSynthesis' in window && (
                <button
                  type="button"
                  onClick={speakReply}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy"
                >
                  <Volume2 className={`size-3.5 ${speaking ? 'animate-pulse' : ''}`} />
                  {speaking ? 'Stop speaking' : 'Speak reply'}
                </button>
              )}
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
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              placeholder={
                listening
                  ? 'Listening…'
                  : mode === 'campaign'
                    ? 'e.g. We’re a skincare startup launching a SPF mist…'
                    : 'e.g. What should I include when I apply?'
              }
              className="w-full rounded-2xl bg-bg px-3 py-2.5 pr-12 text-sm outline-none"
            />
            <button
              type="button"
              onClick={toggleListening}
              disabled={busy || !voiceSupported}
              title={
                voiceSupported
                  ? listening
                    ? 'Stop listening'
                    : 'Speak your message'
                  : 'Voice not supported in this browser'
              }
              aria-label={
                voiceSupported
                  ? listening
                    ? 'Stop listening'
                    : 'Speak your message'
                  : 'Voice not supported in this browser'
              }
              className={`absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                listening
                  ? 'animate-pulse bg-danger text-white'
                  : 'bg-navy text-white hover:bg-[#152a4a]'
              }`}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          </div>
          {listening && (
            <p className="text-xs font-medium text-danger">Listening — speak now (en-US)</p>
          )}
          {!voiceSupported && (
            <p className="text-xs text-muted">Voice not supported in this browser — type instead.</p>
          )}
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
