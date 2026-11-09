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

export const MOLCOM_STORAGE_KEY = 'molcomMode'

//몰컴 테마(GPT 스타일 채팅) 켜기/끄기
export const molcomModeState = atom<boolean>({
  key: 'molcomModeState',
  default: localStorage.getItem(MOLCOM_STORAGE_KEY) === 'true',
  effects: [
    ({ onSet }) => {
      onSet((isOn) => localStorage.setItem(MOLCOM_STORAGE_KEY, String(isOn)))
    },
  ],
})
