import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TierGate } from '../components/ui/TierGate'
import { UserTierProvider } from '../contexts/UserTierContext'
import { ThemeProvider } from '../contexts/ThemeContext'

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
  })),
}))

function Providers({ tier = 'Free', children }: { tier?: string; children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserTierProvider _overrideTierForTest={tier as any}>{children}</UserTierProvider>
    </ThemeProvider>
  )
}

describe('TierGate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders children when user meets required tier', () => {
    render(
      <Providers tier="Base">
        <TierGate requiredTier="Base">
          <Text>Premium Content</Text>
        </TierGate>
      </Providers>
    )
    expect(screen.getByText('Premium Content')).toBeTruthy()
  })

  it('renders locked overlay when user does not meet tier', () => {
    render(
      <Providers tier="Free">
        <TierGate requiredTier="Base">
          <Text>Premium Content</Text>
        </TierGate>
      </Providers>
    )
    expect(screen.queryByText('Premium Content')).toBeNull()
    expect(screen.getByText(/Upgrade/i)).toBeTruthy()
  })

  it('renders coming-soon overlay for Premium_AI blocks', () => {
    render(
      <Providers tier="Base">
        <TierGate requiredTier="Premium_AI" variant="coming-soon">
          <Text>AI Feature</Text>
        </TierGate>
      </Providers>
    )
    expect(screen.queryByText('AI Feature')).toBeNull()
    expect(screen.getByText(/Coming Soon/i)).toBeTruthy()
  })
})
