//사진 메시지는 content에 [image:<스토리지 경로>] 형태로 저장한다 (이모티콘의 [emoji:...]와 같은 방식)
const IMAGE_MESSAGE_PATTERN = /^\[image:([^\]]+)\]$/
export const IMAGE_PREVIEW_TEXT = '(사진)'

export const toImageContent = (path: string) => `[image:${path}]`

//사진 메시지면 스토리지 경로를, 아니면 null 반환
export const parseImageContent = (content: string): string | null => IMAGE_MESSAGE_PATTERN.exec(content)?.[1] ?? null
