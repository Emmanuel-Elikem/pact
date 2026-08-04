import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  WalletCards,
} from 'lucide-react'
import { BrandMark } from './BrandMark'
import { useWallet } from '../context/WalletProvider'
import { useApp } from '../context/AppProvider'
import { truncateAddress } from '../lib/format'

export function Layout() {
  const { address, mode, disconnect } = useWallet()
  const { role, brand, creator } = useApp()
  const navigate = useNavigate()
  const label =
    role === 'brand'
      ? brand.name || 'Brand'
      : creator.name || creator.username || 'Creator'

  async function onLogout() {
    await disconnect()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="app-shell app-shell--app flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-5 pb-2 pt-5">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-navy text-white">
            <BrandMark className="size-5" />
          </span>
          <span className="text-left">
            <span className="block text-[17px] font-bold leading-none tracking-tight text-ink">
              Trendit
            </span>
            <span className="mt-1 block text-[11px] text-muted">
              {label} · {truncateAddress(address)}
              {mode === 'demo' ? ' · Demo' : mode === 'waap' ? ' · Signed in' : ''}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => void onLogout()}
          className="flex size-10 items-center justify-center rounded-full bg-white text-navy ring-1 ring-border"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-32 pt-2">
        <Outlet />
      </main>

      <nav className="app-shell__nav" aria-label="Primary">
        <div className="pointer-events-auto flex items-center justify-around rounded-full border border-white/70 bg-white/90 px-1 py-2 shadow-[0_12px_40px_-16px_rgba(11,31,58,0.45)] backdrop-blur-xl">
          <NavItem to="/" icon={Home} label="Home" end />
          <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" />
          {role === 'brand' ? (
            <NavItem to="/campaigns/new" icon={Plus} label="Create" />
          ) : (
            <NavItem to="/profile" icon={Plus} label="Profile" />
          )}
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/funds" icon={WalletCards} label="Funds" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string
  icon: typeof Home
  label: string
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-w-[3.5rem] flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium ${
          isActive ? 'text-navy' : 'text-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative flex size-8 items-center justify-center rounded-full ${
              isActive ? 'bg-navy-soft' : ''
            }`}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
