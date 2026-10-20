//멘션은 content 안에 '@이름' 글자 그대로 저장한다 (별도 컬럼 없이 받는 쪽에서 내 이름이 있는지 확인)
const MENTION_TRIGGER_PATTERN = /(^|\s)@([^\s@]*)$/
const NAME_BOUNDARY = '(?=$|[\\s.,!?~:;)\\]])'

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const toMentionText = (name: string) => `@${name}`

//content에 '@name' 멘션이 있는지 (뒤에 이름이 더 이어지는 다른 이름은 제외)
export const isMentioned = (content: string, name: string): boolean =>
  Boolean(name) && new RegExp(`(^|\\s)${escapeRegExp(toMentionText(name))}${NAME_BOUNDARY}`).test(content)

//커서 앞 글자가 '@검색어'로 끝나면 검색어를, 아니면 null 반환
export const findMentionQuery = (textBeforeCaret: string): string | null =>
  MENTION_TRIGGER_PATTERN.exec(textBeforeCaret)?.[2] ?? null

//커서 앞의 '@검색어'를 '@이름 '으로 바꾼 전체 텍스트와 새 커서 위치를 반환
export const insertMention = (text: string, caret: number, name: string): { text: string; caret: number } => {
  const before = text.slice(0, caret).replace(/@[^\s@]*$/, `${toMentionText(name)} `)
  return { text: before + text.slice(caret), caret: before.length }
}

export interface MentionSegment {
  text: string
  isMention: boolean
}

//말풍선에서 멘션만 강조할 수 있도록 content를 조각으로 나눔
export const splitMentions = (content: string, names: string[]): MentionSegment[] => {
  const validNames = names.filter(Boolean).sort((a, b) => b.length - a.length)
  if (validNames.length === 0) return [{ text: content, isMention: false }]
  const pattern = new RegExp(
    `(^|\\s)(${validNames.map((name) => escapeRegExp(toMentionText(name))).join('|')})${NAME_BOUNDARY}`,
    'g',
  )
  const segments: MentionSegment[] = []
  let cursor = 0
  for (const match of Array.from(content.matchAll(pattern))) {
    const start = (match.index ?? 0) + match[1].length
    if (start > cursor) segments.push({ text: content.slice(cursor, start), isMention: false })
    segments.push({ text: match[2], isMention: true })
    cursor = start + match[2].length
  }
  if (cursor < content.length) segments.push({ text: content.slice(cursor), isMention: false })
  return segments
}
