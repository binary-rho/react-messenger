import styled from 'styled-components'
import { colors } from '../style/colors'

export interface AttachMenuItem {
  key: string
  label: string
  icon: string
  onSelect: () => void
}

//+ 버튼을 누르면 입력창 위에 열리는 첨부 메뉴. 항목은 배열로 받으므로 카메라/파일 등은 항목만 추가하면 된다
export const AttachMenu = ({ items }: { items: AttachMenuItem[] }) => (
  <Panel>
    {items.map((item) => (
      <ItemButton key={item.key} type="button" onClick={item.onSelect}>
        <ItemIcon>{item.icon}</ItemIcon>
        <ItemLabel>{item.label}</ItemLabel>
      </ItemButton>
    ))}
  </Panel>
)

const ITEM_ICON_SIZE_PX = 56

const Panel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  flex-shrink: 0;
  width: 100%;
  padding: 16px 20px;
  background-color: ${colors.surface};
  border-top: 1px solid ${colors.grey_100};
`

const ItemButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
`

const ItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${ITEM_ICON_SIZE_PX}px;
  height: ${ITEM_ICON_SIZE_PX}px;
  border-radius: 50%;
  background-color: ${colors.grey_50};
  font-size: 26px;
`

const ItemLabel = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Light';
  font-size: 13px;
`
