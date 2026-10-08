const lightPalette = {
  green: '#4EDB28',
  purple: '#5D5FEF',
  white: '#FFFFFF', // 강조색(보라/초록) 위의 글자색 — 테마와 무관하게 고정
  surface: '#FFFFFF',
  outside: '#292929',

  grey_50: '#F6F6FA',
  grey_100: '#DEE1E9',
  grey_300: '#C6CCD4',
  grey_400: '#A1A8B2',
  grey_700: '#686A73',
  grey_900: '#292929',
}

const darkPalette: typeof lightPalette = {
  green: '#4EDB28',
  purple: '#5D5FEF',
  white: '#FFFFFF',
  surface: '#1E1F24',
  outside: '#000000',

  grey_50: '#121317',
  grey_100: '#33363D',
  grey_300: '#4A4E57',
  grey_400: '#8B919C',
  grey_700: '#A9AFBA',
  grey_900: '#ECEDF0',
}

type ColorKey = keyof typeof lightPalette

const cssVarName = (key: ColorKey) => `--color-${key.replace('_', '-')}`

// 컴포넌트는 기존처럼 colors.xxx 를 쓰고, 실제 값은 테마별 CSS 변수가 결정한다
export const colors = Object.fromEntries(
  (Object.keys(lightPalette) as ColorKey[]).map((key) => [key, `var(${cssVarName(key)})`]),
) as Record<ColorKey, string>

const toCssVariables = (palette: typeof lightPalette) =>
  (Object.keys(palette) as ColorKey[]).map((key) => `${cssVarName(key)}: ${palette[key]};`).join('\n')

export const themeCssVariables = {
  light: toCssVariables(lightPalette),
  dark: toCssVariables(darkPalette),
}
