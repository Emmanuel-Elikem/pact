import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

type ToastKind = 'pending' | 'success' | 'error' | 'info'

type Toast = {
  id: string
  kind: ToastKind
  title: string
  detail?: string
}

type ToastContextValue = {
  push: (t: Omit<Toast, 'id'>) => string
  update: (id: string, patch: Partial<Omit<Toast, 'id'>>) => void
  dismiss: (id: string) => void
  withTx: <T>(label: string, fn: () => Promise<T>) => Promise<T>
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...t, id }])
    if (t.kind !== 'pending') {
      setTimeout(() => dismiss(id), 4500)
    }
    return id
  }, [dismiss])

  const update = useCallback((id: string, patch: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    if (patch.kind && patch.kind !== 'pending') {
      setTimeout(() => dismiss(id), 4500)
    }
  }, [dismiss])

  const withTx = useCallback(
    async <T,>(label: string, fn: () => Promise<T>) => {
      const id = push({ kind: 'pending', title: label, detail: 'Confirm in wallet…' })
      try {
        const result = await fn()
        update(id, { kind: 'success', title: `${label} done`, detail: undefined })
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed'
        update(id, { kind: 'error', title: `${label} failed`, detail: msg.slice(0, 120) })
        throw e
      }
    },
    [push, update],
  )

  const value = useMemo(() => ({ push, update, dismiss, withTx }), [push, update, dismiss, withTx])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto flex gap-3 rounded-[1.25rem] border border-black/5 bg-surface px-4 py-3 shadow-[0_12px_40px_-20px_rgba(61,35,20,0.45)]"
            >
              <span className="mt-0.5">
                {t.kind === 'pending' && <Loader2 className="size-5 animate-spin text-leaf" />}
                {t.kind === 'success' && <CheckCircle2 className="size-5 text-leaf" />}
                {t.kind === 'error' && <XCircle className="size-5 text-danger" />}
                {t.kind === 'info' && <CheckCircle2 className="size-5 text-gold" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.detail && <p className="mt-0.5 truncate text-xs text-muted">{t.detail}</p>}
              </div>
              <button
                type="button"
                className="text-xs font-medium text-muted"
                onClick={() => dismiss(t.id)}
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
