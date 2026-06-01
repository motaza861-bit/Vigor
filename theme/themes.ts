export type ThemeKey = 'DarkAthleticRed' | 'DarkVolt' | 'LightMinimal'

export type ThemeTokens = {
  key: ThemeKey
  bg: string
  surface: string
  border: string
  accent: string
  accentDim: string
  text: string
  textMuted: string
  isDark: boolean
}

export const themes: Record<ThemeKey, ThemeTokens> = {
  DarkAthleticRed: {
    key: 'DarkAthleticRed',
    bg: '#000000',
    surface: '#0F0F0F',
    border: '#1A1A1A',
    accent: '#FF3B30',
    accentDim: '#7A1A15',
    text: '#FFFFFF',
    textMuted: '#6B6B6B',
    isDark: true,
  },
  DarkVolt: {
    key: 'DarkVolt',
    bg: '#000000',
    surface: '#0A0A0A',
    border: '#1C1C1C',
    accent: '#C8FF00',
    accentDim: '#5A7200',
    text: '#FFFFFF',
    textMuted: '#666666',
    isDark: true,
  },
  LightMinimal: {
    key: 'LightMinimal',
    bg: '#F9F9F9',
    surface: '#FFFFFF',
    border: '#EBEBEB',
    accent: '#1A1A1A',
    accentDim: '#CCCCCC',
    text: '#0A0A0A',
    textMuted: '#9A9A9A',
    isDark: false,
  },
}

export const DEFAULT_THEME: ThemeKey = 'DarkAthleticRed'
