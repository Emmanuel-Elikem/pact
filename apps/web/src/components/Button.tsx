import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'black'

const styles: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-[#152a4a]',
  secondary: 'bg-white text-navy ring-1 ring-border hover:bg-navy-soft',
  black: 'bg-black text-white hover:bg-neutral-800',
  ghost: 'bg-transparent text-navy hover:bg-navy-soft',
  danger: 'bg-danger-soft text-danger hover:bg-[#fde8e6]',
}

export function Button({
  children,
  variant = 'primary',
  loading,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  loading?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[999px] px-5 text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
