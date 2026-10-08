import { atom } from 'recoil'

export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'themeMode'

const readStoredThemeMode = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const themeModeState = atom<ThemeMode>({
  key: 'themeModeState',
  default: readStoredThemeMode(),
  effects: [
    ({ onSet }) => {
      onSet((mode) => localStorage.setItem(THEME_STORAGE_KEY, mode))
    },
  ],
})
