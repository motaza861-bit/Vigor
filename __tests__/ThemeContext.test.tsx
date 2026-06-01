import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
  })),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('ThemeContext', () => {
  it('defaults to DarkAthleticRed', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeKey).toBe('DarkAthleticRed')
    expect(result.current.theme.accent).toBe('#FF3B30')
  })

  it('switches theme and returns new tokens', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme('DarkVolt'))
    expect(result.current.themeKey).toBe('DarkVolt')
    expect(result.current.theme.accent).toBe('#C8FF00')
  })

  it('persists theme key to MMKV on switch', () => {
    // require() needed here to re-read the mock after mockImplementation reassignment
    const { MMKV } = require('react-native-mmkv')
    const mockSet = jest.fn()
    MMKV.mockImplementation(() => ({ getString: jest.fn(), set: mockSet }))
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme('LightMinimal'))
    expect(mockSet).toHaveBeenCalledWith('key', 'LightMinimal')
  })

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used inside ThemeProvider')
  })
})
