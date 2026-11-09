const lightPalette = {
  green: '#4EDB28',
  purple: '#5D5FEF',
  red: '#F04438',
  white: '#FFFFFF', // 강조색(보라/초록/빨강) 위의 글자색 — 테마와 무관하게 고정
  surface: '#FFFFFF',
  outside: '#292929',

  grey_50: '#F6F6FA',
  grey_100: '#DEE1E9',
  grey_300: '#C6CCD4',
  grey_400: '#A1A8B2',
  grey_700: '#686A73',
  grey_900: '#292929',

  myBubble: '#5D5FEF', // 내 말풍선 배경/글자
  myBubbleText: '#FFFFFF',
  otherBubble: '#FFFFFF', // 상대 말풍선 배경
}

const darkPalette: typeof lightPalette = {
  green: '#4EDB28',
  purple: '#5D5FEF',
  red: '#F04438',
  white: '#FFFFFF',
  surface: '#1E1F24',
  outside: '#000000',

  grey_50: '#121317',
  grey_100: '#33363D',
  grey_300: '#4A4E57',
  grey_400: '#8B919C',
  grey_700: '#A9AFBA',
  grey_900: '#ECEDF0',

  myBubble: '#5D5FEF',
  myBubbleText: '#FFFFFF',
  otherBubble: '#1E1F24',
}

//몰컴 테마 (모바일 GPT 채팅 느낌): 내 메시지만 회색 말풍선, 상대 메시지는 말풍선 없이 글자만
const molcomLightPalette: typeof lightPalette = {
  ...lightPalette,
  surface: '#FFFFFF',
  grey_50: '#FFFFFF',
  grey_100: '#E5E5E5',
  grey_300: '#C4C4C4',
  grey_400: '#8F8F8F',
  grey_700: '#5D5D5D',
  grey_900: '#0D0D0D',
  myBubble: '#F4F4F4',
  myBubbleText: '#0D0D0D',
  otherBubble: 'transparent',
}

const molcomDarkPalette: typeof lightPalette = {
  ...darkPalette,
  surface: '#212121',
  grey_50: '#212121',
  grey_100: '#383838',
  grey_300: '#5A5A5A',
  grey_400: '#9B9B9B',
  grey_700: '#B4B4B4',
  grey_900: '#ECECEC',
  myBubble: '#303030',
  myBubbleText: '#ECECEC',
  otherBubble: 'transparent',
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
  molcomLight: toCssVariables(molcomLightPalette),
  molcomDark: toCssVariables(molcomDarkPalette),
}
