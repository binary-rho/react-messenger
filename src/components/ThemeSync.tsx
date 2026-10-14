import { useLayoutEffect } from 'react'
import { useRecoilValue } from 'recoil'
import { themeModeState } from '../states/themeAtom'

//선택된 테마를 <html data-theme>에 반영 (모든 화면에 적용되도록 앱 최상단에서 한 번만 사용)
export const ThemeSync = () => {
  const themeMode = useRecoilValue(themeModeState)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  return null
}
