import styled from 'styled-components'
import { useState } from 'react'
import { colors } from '../style/colors'
import {
  hasNotificationAbility,
  isNotificationPreferenceOn,
  isWebNotificationSupported,
  requestNotificationPermission,
  setNotificationPreference,
} from '../lib/notification'

const isPermissionBlocked = (): boolean =>
  !window.electronAPI && (!isWebNotificationSupported() || Notification.permission === 'denied')

const getBlockedMessage = (): string =>
  isWebNotificationSupported() ? '브라우저 설정에서 알림을 허용해주세요' : '이 브라우저는 알림을 지원하지 않아요'

//알림 켜기/끄기 스위치
export const NotificationToggle = () => {
  const [isOn, setIsOn] = useState<boolean>(isNotificationPreferenceOn() && hasNotificationAbility())
  const isBlocked = isPermissionBlocked()

  const onToggle = async () => {
    if (isOn) {
      setNotificationPreference(false)
      setIsOn(false)
      return
    }
    //웹에서 아직 권한을 묻지 않았다면 켤 때 권한을 요청 (사용자 클릭 안에서 호출해야 함)
    if (!window.electronAPI && Notification.permission === 'default') await requestNotificationPermission()
    if (!hasNotificationAbility()) {
      setIsOn(false)
      return
    }
    setNotificationPreference(true)
    setIsOn(true)
  }

  return (
    <Row>
      <Label>
        <LabelTitle>알림</LabelTitle>
        {isBlocked && <LabelHint>{getBlockedMessage()}</LabelHint>}
      </Label>
      <Switch type="button" role="switch" aria-checked={isOn} disabled={isBlocked} onClick={onToggle}>
        <Knob $isOn={isOn} />
      </Switch>
    </Row>
  )
}

const SWITCH_WIDTH_REM = 2.75
const KNOB_SIZE_REM = 1.25
const KNOB_GAP_REM = 0.1875

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 1.25rem 0 1.25rem;
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
