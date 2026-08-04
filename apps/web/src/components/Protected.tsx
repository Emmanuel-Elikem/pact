import { Navigate, Outlet } from 'react-router-dom'
import { useWallet } from '../context/WalletProvider'

export function Protected() {
  const { address, connecting } = useWallet()
  if (connecting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Connecting…
      </div>
    )
  }
  if (!address) return <Navigate to="/signin" replace />
  return <Outlet />
}
