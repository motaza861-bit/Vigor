import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { MMKV } from 'react-native-mmkv'
import { DEFAULT_THEME, ThemeKey, themes, ThemeTokens } from '../theme/themes'

type ThemeContextValue = {
  theme: ThemeTokens
  themeKey: ThemeKey
  setTheme: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storageRef = useRef<InstanceType<typeof MMKV> | null>(null)
  if (storageRef.current === null) {
    storageRef.current = new MMKV({ id: 'theme' })
  }

  const [themeKey, setThemeKeyState] = useState<ThemeKey>(
    () => (storageRef.current!.getString('key') as ThemeKey) ?? DEFAULT_THEME
  )

  const setTheme = useCallback((key: ThemeKey) => {
    storageRef.current!.set('key', key)
    setThemeKeyState(key)
  }, [])

  const theme = useMemo(() => themes[themeKey], [themeKey])
  const value = useMemo(() => ({ theme, themeKey, setTheme }), [theme, themeKey, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
