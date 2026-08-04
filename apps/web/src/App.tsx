import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Protected } from './components/Protected'
import { WalletProvider } from './context/WalletProvider'
import { ToastProvider } from './context/ToastProvider'
import { AppProvider } from './context/AppProvider'
import { Onboarding } from './pages/Onboarding'
import { SignIn } from './pages/SignIn'
import { Welcome } from './pages/Welcome'
import { Home } from './pages/Home'
import { NewCampaign } from './pages/NewCampaign'
import { CampaignDetail } from './pages/CampaignDetail'
import { Campaigns } from './pages/Campaigns'
import { Funds } from './pages/Funds'
import { Profile } from './pages/Profile'
import { Dashboard } from './pages/Dashboard'
import { isOnboardingSeen } from './lib/store'

function RootRedirect() {
  if (!isOnboardingSeen()) return <Navigate to="/onboarding" replace />
  return <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <WalletProvider>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/signin" element={<SignIn />} />
              <Route element={<Protected />}>
                <Route path="welcome" element={<Welcome />} />
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="campaigns" element={<Campaigns />} />
                  <Route path="campaigns/new" element={<NewCampaign />} />
                  <Route path="campaigns/:id" element={<CampaignDetail />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="funds" element={<Funds />} />
                  <Route path="faucet" element={<Navigate to="/funds" replace />} />
                  <Route path="wallet" element={<Navigate to="/funds" replace />} />
                  <Route path="creators" element={<Navigate to="/campaigns" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </WalletProvider>
  )
}
