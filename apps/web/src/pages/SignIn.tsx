import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Handshake, KeyRound, Sparkles, Wallet } from 'lucide-react'
import { Button } from '../components/Button'
import { useWallet } from '../context/WalletProvider'

export function SignIn() {
  const { connectWaap, connectDemo, connecting, error, address } = useWallet()
  const navigate = useNavigate()
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (address) navigate('/', { replace: true })
  }, [address, navigate])

  async function onWaap() {
    setLocalError(null)
    try {
      await connectWaap()
      navigate('/')
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'WAAP failed')
    }
  }

  async function onDemo() {
    setLocalError(null)
    try {
      await connectDemo()
      navigate('/')
    } catch (e) {
      setLocalError(
        e instanceof Error
          ? e.message
          : 'Demo wallet needs VITE_DEMO_PRIVATE_KEY',
      )
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8e9ed] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-shell w-full !min-h-0 overflow-hidden rounded-[2rem] p-6 shadow-[0_24px_80px_-40px_rgba(11,31,58,0.4)]"
      >
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-navy text-white">
          <Handshake className="size-6" strokeWidth={2} />
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-ink">Pact</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Campaign funds locked until creators deliver.
        </p>

        <div className="mt-8 space-y-3">
          <Button loading={connecting} onClick={() => void onWaap()}>
            <Wallet className="size-4" /> Continue with WAAP
          </Button>
          <Button variant="black" loading={connecting} onClick={() => void onDemo()}>
            <KeyRound className="size-4" /> Demo wallet (Anvil)
          </Button>
        </div>

        {(localError || error) && (
          <p className="mt-4 rounded-2xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {localError || error}
          </p>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
          Prefer WAAP for real login. Demo mode uses a local Anvil key for judges offline.
        </p>
      </motion.div>
    </div>
  )
}
