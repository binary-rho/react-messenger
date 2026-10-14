import { useState } from 'react'
import { SettingToggleRow } from './SettingToggleRow'
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
    <SettingToggleRow
      title="알림"
      hint={isBlocked ? getBlockedMessage() : undefined}
      isOn={isOn}
      isDisabled={isBlocked}
      onToggle={onToggle}
    />
  )
}
