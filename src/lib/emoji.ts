//public/emoji 에 이모티콘 파일을 넣은 뒤, 파일명을 여기에 추가하세요. (예: 'happy.png')
export const EMOJI_FILES: string[] = [
  'ganadi.gif',
  'nurung.png',
  '가나디분노.gif',
  '가나디피곤.gif',
  '경악가나디.gif',
  '농담곰2.png',
  '엉엉가나디.gif',
  '헉가나디.gif',
]

const EMOJI_DIR = '/emoji'
const EMOJI_MESSAGE_PATTERN = /^\[emoji:([^\]/\\]+)\]$/
export const EMOJI_PREVIEW_TEXT = '(이모티콘)'

export const toEmojiContent = (fileName: string) => `[emoji:${fileName}]`

//이모티콘 메시지면 파일명을, 일반 텍스트면 null 반환
export const parseEmojiContent = (content: string): string | null => EMOJI_MESSAGE_PATTERN.exec(content)?.[1] ?? null

export const resolveEmojiSrc = (fileName: string) => `${process.env.PUBLIC_URL ?? ''}${EMOJI_DIR}/${encodeURIComponent(fileName)}`
