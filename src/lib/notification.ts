export type AppNotification = { title: string; body: string; path: string }

export const isWebNotificationSupported = (): boolean => typeof Notification !== 'undefined'

const NOTIFICATION_PREFERENCE_KEY = 'notificationEnabled'

//브라우저 권한은 코드로 해제할 수 없으므로, 앱 안에서 알림을 끄고 켜는 설정을 따로 저장 (기본값은 켜짐)
export const isNotificationPreferenceOn = (): boolean => {
  try {
    return localStorage.getItem(NOTIFICATION_PREFERENCE_KEY) !== 'false'
  } catch {
    return true
  }
}

export const setNotificationPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, String(enabled))
  } catch (error) {
    console.error(error)
  }
}

//Electron 앱이거나, 웹에서 알림 권한이 허용된 경우에만 알림을 띄울 수 있음
export const hasNotificationAbility = (): boolean =>
  Boolean(window.electronAPI) || (isWebNotificationSupported() && Notification.permission === 'granted')

export const canShowNotification = (): boolean => isNotificationPreferenceOn() && hasNotificationAbility()

//반드시 버튼 클릭 같은 사용자 동작 안에서 호출해야 함 (Safari 요구사항)
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isWebNotificationSupported()) return 'denied'
  return Notification.requestPermission()
}

export const showNotification = ({ title, body, path }: AppNotification, onClick: (path: string) => void) => {
  if (!isNotificationPreferenceOn()) return
  if (window.electronAPI) {
    window.electronAPI.notify({ title, body, path })
    return
  }
  if (!canShowNotification()) return
  const notification = new Notification(title, { body })
  notification.onclick = () => {
    window.focus()
    onClick(path)
    notification.close()
  }
}
