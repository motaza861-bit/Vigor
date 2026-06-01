import React from 'react'
import { ThemeProvider } from './ThemeContext'
import { UserTierProvider } from './UserTierContext'

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserTierProvider>{children}</UserTierProvider>
    </ThemeProvider>
  )
}
