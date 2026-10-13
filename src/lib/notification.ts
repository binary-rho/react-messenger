export type AppNotification = { title: string; body: string; path: string }

export const isWebNotificationSupported = (): boolean => typeof Notification !== 'undefined'

//Electron 앱이거나, 웹에서 알림 권한이 허용된 경우에만 알림을 띄울 수 있음
export const canShowNotification = (): boolean =>
  Boolean(window.electronAPI) || (isWebNotificationSupported() && Notification.permission === 'granted')

//반드시 버튼 클릭 같은 사용자 동작 안에서 호출해야 함 (Safari 요구사항)
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isWebNotificationSupported()) return 'denied'
  return Notification.requestPermission()
}

export const showNotification = ({ title, body, path }: AppNotification, onClick: (path: string) => void) => {
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
