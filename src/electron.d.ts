interface ElectronAPI {
  notify: (payload: { title: string; body: string; path?: string }) => void
  onNotificationClick: (callback: (path: string) => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
