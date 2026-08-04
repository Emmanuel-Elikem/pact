import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletProvider'
import { useApp } from '../context/AppProvider'

export function Protected() {
  const { address, connecting } = useWallet()
  const { welcomeDone } = useApp()
  const location = useLocation()

  // Only block when restoring a session with no address yet.
  // Never blank the tree during an active login — that unmounts routes and breaks the WaaP modal.
  if (!address && connecting) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Connecting…
      </div>
    )
  }
  if (!address) return <Navigate to="/signin" replace />
  if (!welcomeDone && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />
  }
  return <Outlet />
}
