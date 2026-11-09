import { css } from 'styled-components'

//Safari 최소 창 너비 정도. 이보다 넓은 화면에서도 앱이 얇아지지 않고 이 폭으로 고정된다
const APP_MAX_WIDTH_PX = 576

//화면 전체를 채우는 앱 프레임: 최대 폭까지는 가득, 그보다 넓으면 최대 폭으로 고정
export const appFrame = css`
  width: 100%;
  max-width: ${APP_MAX_WIDTH_PX}px;
  height: 100%;
`
