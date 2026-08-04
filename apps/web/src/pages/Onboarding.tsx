import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '../components/Button'
import { setOnboardingSeen } from '../lib/store'

const SLIDES = [
  {
    key: 'intro',
    eyebrow: 'Welcome to Trendit',
    title: 'Your brand. Creators everywhere.',
    body: 'Want your product seen in other cities and countries — but you don’t know the creators there? Trendit connects you in minutes.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'brands',
    eyebrow: 'For brands',
    title: 'Post a campaign. Lock a reward. Grow.',
    body: 'Create a simple brief with photos and rules. Funds stay safe until creators deliver. Reach new audiences through people who already have the trust.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'creators',
    eyebrow: 'For creators',
    title: 'Make content for brands worldwide.',
    body: 'Creators can open doors for brands — and get paid for real work. Find campaigns from other countries, apply, create, and earn when the goal is met.',
    image:
      'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'flow',
    eyebrow: 'How it works',
    title: 'Simple from start to payout.',
    body: 'Brand creates a campaign → creators apply → brand can pick who joins → creators submit → when the deadline clears, payout is released. Fair for everyone.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
  },
] as const

export function Onboarding() {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  function finish() {
    setOnboardingSeen()
    navigate('/signin', { replace: true })
  }

  function next() {
    if (last) finish()
    else setIndex((i) => i + 1)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8e9ed] px-3 py-6">
      <div className="app-shell relative flex w-full !min-h-[min(100dvh,720px)] flex-col overflow-hidden rounded-[2rem] bg-bg shadow-[0_24px_80px_-40px_rgba(11,31,58,0.4)]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-5">
          <div className="flex gap-1.5">
            {SLIDES.map((s, i) => (
              <span
                key={s.key}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
          >
            Skip
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.key}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="relative h-[48%] min-h-[220px] shrink-0 overflow-hidden">
              <img src={slide.image} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-black/25" />
            </div>

            <div className="flex flex-1 flex-col px-6 pb-6 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {slide.eyebrow}
              </p>
              <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-ink">
                {slide.title}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{slide.body}</p>

              <div className="mt-auto space-y-3 pt-8">
                <Button onClick={next}>
                  {last ? 'Get started' : 'Continue'}
                  <ArrowRight className="size-4" />
                </Button>
                {!last && (
                  <p className="text-center text-xs text-muted">
                    {index + 1} of {SLIDES.length}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
