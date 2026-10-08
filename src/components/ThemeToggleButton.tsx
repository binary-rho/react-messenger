import { useLayoutEffect } from 'react'
import { useRecoilState } from 'recoil'
import styled from 'styled-components'
import { themeModeState } from '../states/themeAtom'

//폰 화면 바깥(뷰포트 우측 상단)에 고정된 다크모드 토글 버튼
export const ThemeToggleButton = () => {
  const [themeMode, setThemeMode] = useRecoilState(themeModeState)
  const isDark = themeMode === 'dark'

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  return (
    <ToggleButton
      type="button"
      onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드' : '다크 모드'}
    >
      {isDark ? '☀️' : '🌙'}
    </ToggleButton>
  )
}

const ToggleButton = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`
