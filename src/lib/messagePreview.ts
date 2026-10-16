import { EMOJI_PREVIEW_TEXT, parseEmojiContent } from './emoji'
import { IMAGE_PREVIEW_TEXT, parseImageContent } from './image'

//채팅 목록, 알림처럼 한 줄 텍스트로 메시지를 보여줘야 할 때 쓰는 문구
export const toPreviewText = (content: string): string => {
  if (parseEmojiContent(content)) return EMOJI_PREVIEW_TEXT
  if (parseImageContent(content)) return IMAGE_PREVIEW_TEXT
  return content
}
