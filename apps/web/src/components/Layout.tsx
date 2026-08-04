import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, Handshake, Home, LogOut, Plus, Sparkles } from 'lucide-react'
import { useWallet } from '../context/WalletProvider'
import { truncateAddress } from '../lib/format'

export function Layout() {
  const { address, mode, disconnect } = useWallet()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onDetail = /^\/campaigns\/\d+/.test(pathname)

  return (
    <div className="app-shell flex flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-navy text-white">
            <Handshake className="size-5" strokeWidth={2} />
          </span>
          <span className="text-left">
            <span className="block text-[17px] font-bold leading-none tracking-tight text-ink">
              Pact
            </span>
            <span className="mt-1 block text-[11px] text-muted">
              {mode === 'demo' ? 'Demo' : 'WAAP'} · {truncateAddress(address)}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <Link
            to="/faucet"
            className="flex size-10 items-center justify-center rounded-full bg-white text-navy ring-1 ring-border"
            aria-label="Faucet"
          >
            <Droplets className="size-4" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => void disconnect()}
            className="flex size-10 items-center justify-center rounded-full bg-white text-navy ring-1 ring-border"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-2">
        <Outlet />
      </main>

      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-4">
        <div className="pointer-events-auto flex items-center justify-around rounded-full border border-white/70 bg-white/90 px-1 py-2 shadow-[0_12px_40px_-16px_rgba(11,31,58,0.45)] backdrop-blur-xl">
          <NavItem to="/" icon={Home} label="Home" active={pathname === '/'} />
          <NavItem
            to="/"
            icon={Sparkles}
            label="Campaigns"
            active={onDetail}
          />
          <NavItem
            to="/campaigns/new"
            icon={Plus}
            label="Create"
            active={pathname === '/campaigns/new'}
          />
          <NavItem to="/faucet" icon={Droplets} label="Faucet" active={pathname === '/faucet'} />
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string
  icon: typeof Home
  label: string
  active: boolean
}) {
  return (
    <NavLink
      to={to}
      className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
        active ? 'text-navy' : 'text-muted'
      }`}
    >
      <span
        className={`relative flex size-8 items-center justify-center rounded-full ${
          active ? 'bg-navy-soft' : ''
        }`}
      >
        <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      </span>
      {label}
    </NavLink>
  )
}
