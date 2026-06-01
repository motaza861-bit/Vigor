import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { MMKV } from 'react-native-mmkv'

export type UserTier = 'Free' | 'Base' | 'Premium_AI'

export const TIER_RANK: Record<UserTier, number> = {
  Free: 0,
  Base: 1,
  Premium_AI: 2,
}

type UserTierContextValue = {
  tier: UserTier
  setTier: (tier: UserTier) => void
  hasAccess: (required: UserTier) => boolean
}

const UserTierContext = createContext<UserTierContextValue | null>(null)

export function UserTierProvider({
  children,
  _overrideTierForTest,
}: {
  children: React.ReactNode
  _overrideTierForTest?: UserTier
}) {
  const storageRef = useRef<InstanceType<typeof MMKV> | null>(null)
  if (storageRef.current === null) {
    storageRef.current = new MMKV({ id: 'user' })
  }

  const [tier, setTierState] = useState<UserTier>(
    () => _overrideTierForTest ?? (storageRef.current!.getString('tier') as UserTier) ?? 'Free'
  )

  const setTier = useCallback((t: UserTier) => {
    storageRef.current!.set('tier', t)
    setTierState(t)
  }, [])

  const hasAccess = useCallback(
    (required: UserTier) => TIER_RANK[tier] >= TIER_RANK[required],
    [tier]
  )

  const value = useMemo(() => ({ tier, setTier, hasAccess }), [tier, setTier, hasAccess])

  return <UserTierContext.Provider value={value}>{children}</UserTierContext.Provider>
}

export function useUserTier(): UserTierContextValue {
  const ctx = useContext(UserTierContext)
  if (!ctx) throw new Error('useUserTier must be used inside UserTierProvider')
  return ctx
}
