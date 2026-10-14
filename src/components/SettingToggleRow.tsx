import styled from 'styled-components'
import { colors } from '../style/colors'

//설정 화면의 "제목 + 스위치" 한 줄
export const SettingToggleRow = ({
  title,
  hint,
  isOn,
  isDisabled,
  onToggle,
}: {
  title: string
  hint?: string
  isOn: boolean
  isDisabled?: boolean
  onToggle: () => void
}) => (
  <Row>
    <Label>
      <LabelTitle>{title}</LabelTitle>
      {hint && <LabelHint>{hint}</LabelHint>}
    </Label>
    <Switch type="button" role="switch" aria-checked={isOn} aria-label={title} disabled={isDisabled} onClick={onToggle}>
      <Knob $isOn={isOn} />
    </Switch>
  </Row>
)

const SWITCH_WIDTH_REM = 2.75
const KNOB_SIZE_REM = 1.25
const KNOB_GAP_REM = 0.1875

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 1.25rem 0 1.25rem;
  padding: 0.6875rem 1.125rem;
  border-radius: 0.375rem;
  background-color: ${colors.surface};
`
const Label = styled.div`
  display: flex;
  flex-direction: column;
`
const LabelTitle = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
`
const LabelHint = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Regular';
  font-size: 0.75rem;
`
const Switch = styled.button`
  position: relative;
  width: ${SWITCH_WIDTH_REM}rem;
  height: ${KNOB_SIZE_REM + KNOB_GAP_REM * 2}rem;
  flex-shrink: 0;
  border: none;
  border-radius: 1rem;
  background-color: ${colors.grey_300};
  cursor: pointer;

  &[aria-checked='true'] {
    background-color: ${colors.purple};
  }
  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`
const Knob = styled.span<{ $isOn: boolean }>`
  position: absolute;
  top: ${KNOB_GAP_REM}rem;
  left: ${({ $isOn }) => ($isOn ? SWITCH_WIDTH_REM - KNOB_SIZE_REM - KNOB_GAP_REM : KNOB_GAP_REM)}rem;
  width: ${KNOB_SIZE_REM}rem;
  height: ${KNOB_SIZE_REM}rem;
  border-radius: 50%;
  background-color: ${colors.white};
  transition: left 0.15s;
`
