import { useRecoilState } from 'recoil'
import { themeModeState } from '../states/themeAtom'
import { SettingToggleRow } from './SettingToggleRow'

//다크모드 켜기/끄기 스위치
export const ThemeToggle = () => {
  const [themeMode, setThemeMode] = useRecoilState(themeModeState)
  const isDark = themeMode === 'dark'

  return <SettingToggleRow title="다크 모드" isOn={isDark} onToggle={() => setThemeMode(isDark ? 'light' : 'dark')} />
}
