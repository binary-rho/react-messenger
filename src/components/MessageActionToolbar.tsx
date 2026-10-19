import styled from 'styled-components'
import { colors } from '../style/colors'
import { ReplyIcon, SmilePlusIcon } from './icons'

const TOOLBAR_ICON_SIZE_PX = 18
const TOOLBAR_HEIGHT_PX = 30

//메시지 위에 마우스를 올리면 나타나는 [이모티콘 | 답장] 버튼 줄. 보이고 숨기는 건 부모(메시지 래퍼)의 hover 스타일이 맡는다
export const MessageActionToolbar = ({
  isMine,
  onReactionClick,
  onReplyClick,
}: {
  isMine: boolean
  onReactionClick: () => void
  onReplyClick: () => void
}) => (
  <Toolbar $isMine={isMine} onClick={(e) => e.stopPropagation()}>
    <ToolbarButton type="button" onClick={onReactionClick} aria-label="이모티콘 달기">
      <SmilePlusIcon size={TOOLBAR_ICON_SIZE_PX} />
    </ToolbarButton>
    <Divider />
    <ToolbarButton type="button" onClick={onReplyClick} aria-label="답장">
      <ReplyIcon size={TOOLBAR_ICON_SIZE_PX} />
    </ToolbarButton>
  </Toolbar>
)

export const Toolbar = styled.div<{ $isMine: boolean }>`
  position: absolute;
  bottom: 100%;
  ${({ $isMine }) => ($isMine ? 'right: 0;' : 'left: 0;')}
  z-index: 1;
  display: none;
  align-items: center;
  height: ${TOOLBAR_HEIGHT_PX}px;
  padding: 0 4px;
  border: 1px solid ${colors.grey_100};
  border-radius: 8px;
  background-color: ${colors.surface};
`

const ToolbarButton = styled.button`
  display: flex;
  border: none;
  padding: 4px 6px;
  background: transparent;
  color: ${colors.grey_700};
  cursor: pointer;

  &:hover {
    color: ${colors.purple};
  }
`

const Divider = styled.span`
  width: 1px;
  height: 16px;
  background-color: ${colors.grey_100};
`
