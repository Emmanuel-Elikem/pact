import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { BrandProfile, CreatorProfile, Role } from '../lib/types'
import {
  isWelcomeDone,
  loadBrandProfile,
  loadCreatorProfile,
  loadRole,
  saveBrandProfile,
  saveCreatorProfile,
  saveRole,
  setWelcomeDone,
} from '../lib/store'

type AppContextValue = {
  role: Role
  setRole: (role: Role) => void
  creator: CreatorProfile
  brand: BrandProfile
  saveCreator: (p: CreatorProfile) => void
  saveBrand: (p: BrandProfile) => void
  welcomeDone: boolean
  completeWelcome: (role: Role) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => loadRole())
  const [creator, setCreator] = useState<CreatorProfile>(() => loadCreatorProfile())
  const [brand, setBrand] = useState<BrandProfile>(() => loadBrandProfile())
  const [welcomeDone, setWelcome] = useState(() => isWelcomeDone())

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    saveRole(next)
  }, [])

  const saveCreator = useCallback((p: CreatorProfile) => {
    setCreator(p)
    saveCreatorProfile(p)
  }, [])

  const saveBrand = useCallback((p: BrandProfile) => {
    setBrand(p)
    saveBrandProfile(p)
  }, [])

  const completeWelcome = useCallback((next: Role) => {
    setRoleState(next)
    saveRole(next)
    setWelcomeDone()
    setWelcome(true)
  }, [])

  const value = useMemo(
    () => ({
      role,
      setRole,
      creator,
      brand,
      saveCreator,
      saveBrand,
      welcomeDone,
      completeWelcome,
    }),
    [role, setRole, creator, brand, saveCreator, saveBrand, welcomeDone, completeWelcome],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
