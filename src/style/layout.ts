import { css } from 'styled-components'

const PHONE_WIDTH_PX = 375
const FOLD_WIDTH_PX = 768

//화면 전체를 채우는 앱 프레임: 폴드 폭까지는 가득, 그보다 넓으면 폰 크기로 고정
export const appFrame = css`
  width: 100%;
  height: 100%;

  @media (min-width: ${FOLD_WIDTH_PX + 1}px) {
    width: ${PHONE_WIDTH_PX}px;
  }
`
