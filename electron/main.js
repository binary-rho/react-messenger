const { app, BrowserWindow, Notification, ipcMain, shell } = require('electron')
const path = require('path')

const APP_URL = process.env.MESSENGER_URL || 'https://react-messenger-black.vercel.app'
const APP_ORIGIN = new URL(APP_URL).origin
const WINDOW_WIDTH = 480
const WINDOW_HEIGHT = 860

let mainWindow = null
let isQuitting = false

const showMainWindow = () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 창이 가려져 있어도 Supabase Realtime 소켓이 끊기지 않도록 함
      backgroundThrottling: false,
    },
  })
  mainWindow.loadURL(APP_URL)

  // 내 도메인 밖으로 나가는 링크는 기본 브라우저로 연다
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin === APP_ORIGIN) return
    event.preventDefault()
    shell.openExternal(url)
  })

  // 닫기 버튼은 종료가 아니라 숨김 (소켓 유지). Cmd+Q 로만 완전 종료
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })
}

const isOwnRendererEvent = (event) => mainWindow && event.sender === mainWindow.webContents

ipcMain.on('notify', (event, { title, body, path: targetPath }) => {
  if (!isOwnRendererEvent(event) || !Notification.isSupported()) return
  const notification = new Notification({ title: String(title), body: String(body) })
  notification.on('click', () => {
    showMainWindow()
    if (typeof targetPath === 'string' && targetPath.startsWith('/')) {
      mainWindow.webContents.send('notification-click', targetPath)
    }
  })
  notification.show()
})

const hasLock = app.requestSingleInstanceLock()
if (!hasLock) {
  app.quit()
} else {
  app.on('second-instance', showMainWindow)
  app.whenReady().then(createWindow)
  app.on('activate', showMainWindow)
  app.on('before-quit', () => {
    isQuitting = true
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
