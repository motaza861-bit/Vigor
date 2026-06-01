import React from 'react'
import { useUserTier, UserTier } from '../../contexts/UserTierContext'
import { LockedOverlay } from '../locked/LockedOverlay'

type TierGateProps = {
  requiredTier: UserTier
  variant?: 'upgrade' | 'coming-soon'
  children: React.ReactNode
}

export function TierGate({ requiredTier, variant = 'upgrade', children }: TierGateProps) {
  const { hasAccess } = useUserTier()
  if (hasAccess(requiredTier)) return <>{children}</>
  return <LockedOverlay variant={variant} requiredTier={requiredTier} />
}
