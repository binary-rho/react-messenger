//src/assets/emoji 에 이미지 파일을 넣기만 하면 자동으로 등록된다
const emojiContext = require.context('../assets/emoji', false, /\.(png|gif|jpe?g|webp)$/i)

const EMOJI_SRC_BY_FILE_NAME = new Map<string, string>(
  emojiContext.keys().map((key) => [key.replace('./', ''), emojiContext(key) as string]),
)

export const EMOJI_FILES: string[] = Array.from(EMOJI_SRC_BY_FILE_NAME.keys()).sort()

const EMOJI_MESSAGE_PATTERN = /^\[emoji:([^\]/\\]+)\]$/
export const EMOJI_PREVIEW_TEXT = '(이모티콘)'

export const toEmojiContent = (fileName: string) => `[emoji:${fileName}]`

//등록된 이모티콘 메시지면 파일명을, 아니면 null 반환
export const parseEmojiContent = (content: string): string | null => {
  const fileName = EMOJI_MESSAGE_PATTERN.exec(content)?.[1]
  return fileName && EMOJI_SRC_BY_FILE_NAME.has(fileName) ? fileName : null
}

export const resolveEmojiSrc = (fileName: string) => EMOJI_SRC_BY_FILE_NAME.get(fileName) ?? ''
