import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc-channels'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
function createMainWindow() {
  console.log('Criando janela principal...')
  mainWindow = new BrowserWindow({
    width: 720,
    height: 680,
    show: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load the remote URL for development or local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools() // Debug
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Hide when focus is lost
  mainWindow.on('blur', () => {
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function toggleWindow() {
  if (!mainWindow) {
    createMainWindow()
  }

  if (mainWindow?.isVisible()) {
    mainWindow.hide()
  } else {
    centerOnActiveScreen(mainWindow!)
    mainWindow?.show()
    mainWindow?.focus()
  }
}

function centerOnActiveScreen(win: BrowserWindow) {
  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)
  const { x, y, width, height } = display.workArea
  const [w, h] = win.getSize()
  
  win.setPosition(
    Math.round(x + (width - w) / 2),
    Math.round(y + (height - h) / 2)
  )
}

function createTray() {
  // Use a simple placeholder icon for now
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar Ghost', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ])
  tray.setToolTip('Ghost AI Assistant')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => toggleWindow())
}

import { registerStoreHandlers } from './ipc/store'

app.whenReady().then(() => {
  createMainWindow()
  createTray()
  app.dock.show() // FORÇAR MOSTRAR NO DOCK DO MACOS

  // Register global shortcut
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleWindow()
  })

  // Register IPC Handlers
  registerStoreHandlers()

  // IPC Handlers
  ipcMain.on(IPC.WINDOW_HIDE, () => mainWindow?.hide())
  ipcMain.on(IPC.WINDOW_TOGGLE, () => toggleWindow())

  // Mock AI response for now
  ipcMain.handle(IPC.AI_SEND_MESSAGE, async (_event, message) => {
    console.log('Received message:', message)
    return { success: true, data: 'Olá! Sou o Spec. Estou sendo transformado em um assistente de reuniões.' }
  })
})

app.on('window-all-closed', (e) => {
  e.preventDefault() // Keep running in background
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
