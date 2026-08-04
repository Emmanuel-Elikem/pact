import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Protected } from './components/Protected'
import { WalletProvider } from './context/WalletProvider'
import { ToastProvider } from './context/ToastProvider'
import { SignIn } from './pages/SignIn'
import { Home } from './pages/Home'
import { NewCampaign } from './pages/NewCampaign'
import { CampaignDetail } from './pages/CampaignDetail'
import { Faucet } from './pages/Faucet'

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route element={<Protected />}>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="campaigns/new" element={<NewCampaign />} />
                <Route path="campaigns/:id" element={<CampaignDetail />} />
                <Route path="faucet" element={<Faucet />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </WalletProvider>
  )
}
