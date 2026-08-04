import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Clapperboard, KeyRound, Wallet } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { useApp } from '../context/AppProvider'
import { useWallet } from '../context/WalletProvider'
import { isOnboardingSeen } from '../lib/store'
import type { Role } from '../lib/types'

export function SignIn() {
  const { connectWaap, connectDemo, connecting, error, address } = useWallet()
  const { setRole, completeWelcome, brand, creator } = useApp()
  const navigate = useNavigate()
  const [rolePick, setRolePick] = useState<Role>('brand')
  const [localError, setLocalError] = useState<string | null>(null)
  const navigating = useRef(false)
  /** Blocks address-driven auto-nav until connectWaap + settle delay finish. */
  const waapLoginInFlight = useRef(false)

  function goAfterAuth(role: Role) {
    if (navigating.current) return
    navigating.current = true
    setRole(role)
    const ready = role === 'brand' ? brand.onboarded : creator.onboarded
    if (ready) {
      completeWelcome(role)
      navigate('/', { replace: true })
    } else {
      navigate('/welcome', { replace: true })
    }
  }

  useEffect(() => {
    if (!isOnboardingSeen()) {
      navigate('/onboarding', { replace: true })
    }
  }, [navigate])

  // Resume only when a session already exists and we are not mid-login
  useEffect(() => {
    if (!address || connecting || navigating.current || waapLoginInFlight.current) return
    goAfterAuth(rolePick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, connecting])

  async function onWaap() {
    setLocalError(null)
    setRole(rolePick)
    navigating.current = false
    waapLoginInFlight.current = true
    try {
      await connectWaap()
      // Let the WaaP portal finish unmounting before we leave SignIn.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          window.setTimeout(resolve, 80)
        })
      })
      goAfterAuth(rolePick)
    } catch (e) {
      navigating.current = false
      setLocalError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      waapLoginInFlight.current = false
    }
  }

  async function onDemo() {
    setLocalError(null)
    setRole(rolePick)
    navigating.current = false
    try {
      await connectDemo()
      goAfterAuth(rolePick)
    } catch (e) {
      navigating.current = false
      setLocalError(e instanceof Error ? e.message : 'Demo sign-in failed')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8e9ed] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-shell w-full !min-h-0 overflow-visible rounded-[2rem] p-6 shadow-[0_24px_80px_-40px_rgba(11,31,58,0.4)]"
      >
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-navy text-white">
          <BrandMark className="size-7" />
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-ink">Trendit</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Brands grow worldwide. Creators get paid for real campaigns.
        </p>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            I am signing in as
          </p>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-border">
            <RoleTab
              active={rolePick === 'brand'}
              icon={Briefcase}
              label="Brand"
              onClick={() => setRolePick('brand')}
            />
            <RoleTab
              active={rolePick === 'creator'}
              icon={Clapperboard}
              label="Creator"
              onClick={() => setRolePick('creator')}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {rolePick === 'brand'
              ? 'Create campaigns, pick creators, lock rewards.'
              : 'Browse campaigns, apply, submit content, get paid.'}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button loading={connecting} onClick={() => void onWaap()}>
            <Wallet className="size-4" /> Continue with email
          </Button>
          <Button variant="secondary" loading={connecting} onClick={() => void onDemo()}>
            <KeyRound className="size-4" /> Try demo account
          </Button>
          <p className="text-center text-[11px] text-muted">
            Secure sign-in — no seed phrases to manage.
          </p>
        </div>

        {(localError || error) && (
          <p className="mt-4 rounded-2xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {localError || error}
          </p>
        )}
      </motion.div>
    </div>
  )
}

function RoleTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Briefcase
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition ${
        active ? 'bg-navy text-white' : 'text-muted'
      }`}
    >
      <Icon className="size-4" strokeWidth={2} />
      {label}
    </button>
  )
}
