import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

//선택 줄과 위/아래 경계 사이에 두는 여유 간격
const PICKER_EDGE_MARGIN_PX = 8
const PICKER_TOOLBAR_OFFSET_PX = 34

type PickerDirection = 'up' | 'down'

//메시지를 눌렀을 때 그 메시지 옆에 열리는 미니 이모티콘 선택 줄.
//아래 공간이 모자라면 위로 열리고, 바깥(backdrop)을 누르거나 Esc를 누르면 닫힌다
export const MiniEmojiPicker = ({
  onSelect,
  onClose,
  boundsRef,
  isMine,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
  boundsRef: RefObject<HTMLElement>
  isMine: boolean
}) => {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [direction, setDirection] = useState<PickerDirection | null>(null)

  //열리는 순간 아래 공간이 충분한지 재서 방향을 정한다 (정해지기 전에는 숨겨 둔다)
  useLayoutEffect(() => {
    const picker = pickerRef.current
    const anchor = picker?.offsetParent
    if (!picker || !anchor) return
    const anchorRect = anchor.getBoundingClientRect()
    const bounds = boundsRef.current?.getBoundingClientRect()
    const spaceBelow = (bounds?.bottom ?? window.innerHeight) - anchorRect.bottom
    const spaceAbove = anchorRect.top - (bounds?.top ?? 0)
    const needed = picker.offsetHeight + PICKER_TOOLBAR_OFFSET_PX + PICKER_EDGE_MARGIN_PX
    setDirection(spaceBelow >= needed || spaceBelow >= spaceAbove ? 'down' : 'up')
  }, [boundsRef])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <>
      <PickerBackdrop onClick={onClose} />
      <PickerRow ref={pickerRef} $direction={direction} $isMine={isMine}>
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
    </>
  )
}

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

//보이지 않는 전체 화면 막. 선택 줄 밖을 누르면 닫히게 한다
const PickerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
`

const PickerRow = styled.div<{ $direction: PickerDirection | null; $isMine: boolean }>`
  position: absolute;
  z-index: 11;
  ${({ $isMine }) => ($isMine ? 'right: 0;' : 'left: 0;')}
  ${({ $direction }) =>
    $direction === 'up' ? 'bottom: calc(100% + 4px);' : `top: calc(100% + ${PICKER_TOOLBAR_OFFSET_PX}px);`}
  visibility: ${({ $direction }) => ($direction ? 'visible' : 'hidden')};
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  width: max-content;
  max-width: 16rem;
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
