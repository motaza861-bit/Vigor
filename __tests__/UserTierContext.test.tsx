import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { UserTierProvider, useUserTier } from '../contexts/UserTierContext'

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
  })),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserTierProvider>{children}</UserTierProvider>
)

describe('UserTierContext', () => {
  it('defaults to Free tier', () => {
    const { result } = renderHook(() => useUserTier(), { wrapper })
    expect(result.current.tier).toBe('Free')
  })

  it('upgrades tier correctly', () => {
    const { result } = renderHook(() => useUserTier(), { wrapper })
    act(() => result.current.setTier('Base'))
    expect(result.current.tier).toBe('Base')
  })

  it('persists tier to MMKV', () => {
    const { MMKV } = require('react-native-mmkv')
    const mockSet = jest.fn()
    MMKV.mockImplementation(() => ({ getString: jest.fn(), set: mockSet }))
    // require() needed here to re-read the mock after mockImplementation reassignment
    const { result } = renderHook(() => useUserTier(), { wrapper })
    act(() => result.current.setTier('Premium_AI'))
    expect(mockSet).toHaveBeenCalledWith('tier', 'Premium_AI')
  })

  it('throws when used outside UserTierProvider', () => {
    expect(() => renderHook(() => useUserTier())).toThrow('useUserTier must be used inside UserTierProvider')
  })
})
