const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (payload) => ipcRenderer.send('notify', payload),
  // 알림 클릭 시 이동할 경로를 받는다. 반환값은 구독 해제 함수
  onNotificationClick: (callback) => {
    const listener = (_event, path) => callback(path)
    ipcRenderer.on('notification-click', listener)
    return () => ipcRenderer.removeListener('notification-click', listener)
  },
})
