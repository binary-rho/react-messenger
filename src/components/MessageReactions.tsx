import { useMemo } from 'react'
import styled from 'styled-components'
import { colors } from '../style/colors'
import { MessageReaction } from '../api/reactions'
import { Profile } from '../api/profile'
import { isRegisteredMiniEmoji, MINI_EMOJI_FILES, resolveMiniEmojiSrc } from '../lib/miniEmoji'

const CHIP_ICON_SIZE_PX = 20
const PICKER_ICON_SIZE_PX = 36
const MY_NAME_LABEL = '나'
const UNKNOWN_USER_NAME = '알 수 없음'
const NAME_SEPARATOR = ', '

interface ReactionGroup {
  emoji: string
  count: number
  isMine: boolean
  userIds: string[]
}

const groupReactions = (reactions: MessageReaction[], myId: string): ReactionGroup[] => {
  const groups = new Map<string, ReactionGroup>()
  reactions.filter((reaction) => isRegisteredMiniEmoji(reaction.emoji)).forEach((reaction) => {
    const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, isMine: false, userIds: [] }
    group.count += 1
    group.userIds.push(reaction.user_id)
    group.isMine = group.isMine || reaction.user_id === myId
    groups.set(reaction.emoji, group)
  })
  return Array.from(groups.values())
}

//이모티콘을 단 사람 이름 목록 (나는 맨 앞에 '나'로 표시)
const toReactorNames = (group: ReactionGroup, myId: string, senders: Map<string, Profile>): string =>
  [...group.userIds]
    .sort((a, b) => Number(b === myId) - Number(a === myId))
    .map((userId) => (userId === myId ? MY_NAME_LABEL : (senders.get(userId)?.name ?? UNKNOWN_USER_NAME)))
    .join(NAME_SEPARATOR)

//메시지 아래에 붙는 리액션 칩 목록 (내가 단 것은 강조, 누르면 취소/추가, 올려두면 단 사람 이름 표시)
export const MessageReactionChips = ({
  reactions,
  myId,
  senders,
  onToggle,
}: {
  reactions: MessageReaction[]
  myId: string
  senders: Map<string, Profile>
  onToggle: (emoji: string) => void
}) => {
  const groups = useMemo(() => groupReactions(reactions, myId), [reactions, myId])
  if (groups.length === 0) return null
  return (
    <ChipRow>
      {groups.map((group) => (
        <Chip
          key={group.emoji}
          type="button"
          $isMine={group.isMine}
          title={toReactorNames(group, myId, senders)}
          onClick={() => onToggle(group.emoji)}
        >
          <ChipImg src={resolveMiniEmojiSrc(group.emoji)} alt={group.emoji} />
          <ChipCount>{group.count}</ChipCount>
        </Chip>
      ))}
    </ChipRow>
  )
}

//메시지를 눌렀을 때 그 아래에 열리는 미니 이모티콘 선택 줄
export const MiniEmojiPicker = ({ onSelect }: { onSelect: (emoji: string) => void }) => (
  <PickerRow>
    {MINI_EMOJI_FILES.length === 0 ? (
      <EmptyText>등록된 미니 이모티콘이 없어요.</EmptyText>
    ) : (
      MINI_EMOJI_FILES.map((fileName) => (
        <PickerButton key={fileName} type="button" onClick={() => onSelect(fileName)}>
          <PickerImg src={resolveMiniEmojiSrc(fileName)} alt={fileName} />
        </PickerButton>
      ))
    )}
  </PickerRow>
)

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 0.5rem;
`

const Chip = styled.button<{ $isMine: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid ${({ $isMine }) => ($isMine ? colors.purple : colors.grey_100)};
  background-color: ${colors.surface};
  cursor: pointer;
`

const ChipImg = styled.img`
  width: ${CHIP_ICON_SIZE_PX}px;
  height: ${CHIP_ICON_SIZE_PX}px;
  object-fit: contain;
`

const ChipCount = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 12px;
`

const PickerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 16rem;
  margin-bottom: 0.5rem;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1px solid ${colors.grey_100};
  background-color: ${colors.surface};
`

const PickerButton = styled.button`
  display: flex;
  border: none;
  padding: 2px;
  background: transparent;
  cursor: pointer;
`

const PickerImg = styled.img`
  width: ${PICKER_ICON_SIZE_PX}px;
  height: ${PICKER_ICON_SIZE_PX}px;
  object-fit: contain;
`

const EmptyText = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Light';
  font-size: 13px;
`
