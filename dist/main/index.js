"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const IPC = {
  // AI Operations
  AI_SEND_MESSAGE: "ai:sendMessage",
  // Window Management
  WINDOW_HIDE: "window:hide",
  WINDOW_TOGGLE: "window:toggle",
  // Configuration & Settings
  STORE_GET: "store:get",
  STORE_SET: "store:set",
  STORE_GET_API_KEY: "store:getApiKey",
  STORE_SET_API_KEY: "store:setApiKey",
  STORE_HAS_API_KEY: "store:hasApiKey",
  STORE_CLEAR_API_KEYS: "store:clearApiKeys"
};
const defaults = {
  shortcut: "CommandOrControl+Shift+Space",
  windowWidth: 720,
  windowHeight: 680,
  defaultAIProvider: "ollama",
  defaultModel: "llama3",
  temperature: 0.7,
  theme: "dark",
  language: "pt"
};
const store = new Store({
  defaults,
  // electron-store encryption - segunda camada de segurança
  encryptionKey: "ghost-ai-assistant-v1"
});
function encryptKey(plainText) {
  if (!electron.safeStorage.isEncryptionAvailable()) {
    console.warn("Encryption not available, storing in plain text (DEV only)");
    return Buffer.from(plainText).toString("base64");
  }
  const encrypted = electron.safeStorage.encryptString(plainText);
  return encrypted.toString("base64");
}
function decryptKey(encryptedBase64) {
  if (!electron.safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encryptedBase64, "base64").toString();
  }
  const buffer = Buffer.from(encryptedBase64, "base64");
  return electron.safeStorage.decryptString(buffer);
}
function getConfig(key) {
  return store.get(key);
}
function setConfig(key, value) {
  store.set(key, value);
}
function setAPIKey(provider, key) {
  if (!key || key.trim().length === 0) {
    return { success: false, error: "API key cannot be empty" };
  }
  const trimmedKey = key.trim();
  if (trimmedKey.length < 10) {
    return { success: false, error: "API key too short - please check" };
  }
  const keyMap = {
    openai: "openaiApiKey",
    anthropic: "anthropicApiKey",
    whisper: "whisperApiKey"
  };
  try {
    const encrypted = encryptKey(trimmedKey);
    store.set(keyMap[provider], encrypted);
    console.log(`API key for ${provider} saved securely`);
    return { success: true };
  } catch (err) {
    console.error(`Error saving API key for ${provider}:`, err);
    return { success: false, error: err.message };
  }
}
function getAPIKey(provider) {
  const keyMap = {
    openai: "openaiApiKey",
    anthropic: "anthropicApiKey",
    whisper: "whisperApiKey"
  };
  try {
    const encrypted = store.get(keyMap[provider]);
    if (!encrypted) return void 0;
    return decryptKey(encrypted);
  } catch (err) {
    console.error(`Error retrieving API key for ${provider}:`, err);
    return void 0;
  }
}
function hasAPIKey(provider) {
  const key = getAPIKey(provider);
  return !!key && key.length > 0;
}
function clearAPIKeys() {
  store.delete("openaiApiKey");
  store.delete("anthropicApiKey");
  store.delete("whisperApiKey");
  console.log("All API keys cleared");
}
function validateAPIKeyFormat(provider, key) {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, error: "API key is empty" };
  }
  switch (provider) {
    case "openai":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: 'OpenAI keys should start with "sk-"' };
      }
      if (trimmed.length < 40) {
        return { valid: false, error: "OpenAI key too short" };
      }
      break;
    case "anthropic":
      if (!trimmed.startsWith("sk-ant-")) {
        return { valid: false, error: 'Anthropic keys should start with "sk-ant-"' };
      }
      break;
    case "whisper":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: 'Whisper keys should start with "sk-"' };
      }
      break;
  }
  return { valid: true };
}
function registerStoreHandlers() {
  electron.ipcMain.handle(IPC.STORE_GET, (_event, key) => {
    try {
      return { success: true, data: getConfig(key) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  electron.ipcMain.handle(IPC.STORE_SET, (_event, key, value) => {
    try {
      setConfig(key, value);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  electron.ipcMain.handle(
    IPC.STORE_SET_API_KEY,
    (_event, provider, key) => {
      const validation = validateAPIKeyFormat(provider, key);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      return setAPIKey(provider, key);
    }
  );
  electron.ipcMain.handle(
    IPC.STORE_GET_API_KEY,
    (_event, provider) => {
      try {
        const key = getAPIKey(provider);
        return { success: true, data: key };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(
    IPC.STORE_HAS_API_KEY,
    (_event, provider) => {
      try {
        const has = hasAPIKey(provider);
        return { success: true, data: has };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  electron.ipcMain.handle(IPC.STORE_CLEAR_API_KEYS, () => {
    try {
      clearAPIKeys();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  console.log("Store IPC handlers registered");
}
let mainWindow = null;
let tray = null;
function createMainWindow() {
  console.log("Criando janela principal...");
  mainWindow = new electron.BrowserWindow({
    width: 720,
    height: 680,
    show: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("blur", () => {
    mainWindow?.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function toggleWindow() {
  if (!mainWindow) {
    createMainWindow();
  }
  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    centerOnActiveScreen(mainWindow);
    mainWindow?.show();
    mainWindow?.focus();
  }
}
function centerOnActiveScreen(win) {
  const cursor = electron.screen.getCursorScreenPoint();
  const display = electron.screen.getDisplayNearestPoint(cursor);
  const { x, y, width, height } = display.workArea;
  const [w, h] = win.getSize();
  win.setPosition(
    Math.round(x + (width - w) / 2),
    Math.round(y + (height - h) / 2)
  );
}
function createTray() {
  const icon = electron.nativeImage.createEmpty();
  tray = new electron.Tray(icon);
  const contextMenu = electron.Menu.buildFromTemplate([
    { label: "Mostrar Ghost", click: () => toggleWindow() },
    { type: "separator" },
    { label: "Sair", click: () => electron.app.quit() }
  ]);
  tray.setToolTip("Ghost AI Assistant");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleWindow());
}
electron.app.whenReady().then(() => {
  createMainWindow();
  createTray();
  electron.app.dock.show();
  electron.globalShortcut.register("CommandOrControl+Shift+Space", () => {
    toggleWindow();
  });
  registerStoreHandlers();
  electron.ipcMain.on(IPC.WINDOW_HIDE, () => mainWindow?.hide());
  electron.ipcMain.on(IPC.WINDOW_TOGGLE, () => toggleWindow());
  electron.ipcMain.handle(IPC.AI_SEND_MESSAGE, async (_event, message) => {
    console.log("Received message:", message);
    return { success: true, data: "Olá! Sou o Spec. Estou sendo transformado em um assistente de reuniões." };
  });
});
electron.app.on("window-all-closed", (e) => {
  e.preventDefault();
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
