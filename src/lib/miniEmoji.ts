//src/assets/mini-emoji 에 이미지 파일을 넣기만 하면 메시지 리액션용 미니 이모티콘으로 자동 등록된다
const miniEmojiContext = require.context('../assets/mini-emoji', false, /\.(png|gif|jpe?g|webp|svg)$/i)

const MINI_EMOJI_SRC_BY_FILE_NAME = new Map<string, string>(
  miniEmojiContext.keys().map((key) => [key.replace('./', ''), miniEmojiContext(key) as string]),
)

export const MINI_EMOJI_FILES: string[] = Array.from(MINI_EMOJI_SRC_BY_FILE_NAME.keys()).sort()

//파일이 지워졌거나 이름이 바뀐 리액션은 이미지를 못 찾으므로 화면에서 숨긴다
export const isRegisteredMiniEmoji = (fileName: string) => MINI_EMOJI_SRC_BY_FILE_NAME.has(fileName)

export const resolveMiniEmojiSrc = (fileName: string) => MINI_EMOJI_SRC_BY_FILE_NAME.get(fileName) ?? ''
