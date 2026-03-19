"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const IPC = {
  // AI Operations
  AI_SEND_MESSAGE: "ai:sendMessage",
  AI_STREAM_CHUNK: "ai:streamChunk",
  AI_CLEAR_HISTORY: "ai:clearHistory",
  AI_LIST_MODELS: "ai:listModels",
  // Ollama Operations
  OLLAMA_CHECK_STATUS: "ollama:checkStatus",
  OLLAMA_LIST_MODELS: "ollama:listModels",
  OLLAMA_SEND_MESSAGE: "ollama:sendMessage",
  OLLAMA_STOP_GENERATION: "ollama:stopGeneration",
  // Window Management
  WINDOW_HIDE: "window:hide",
  WINDOW_TOGGLE: "window:toggle",
  WINDOW_READY: "window:ready",
  // Configuration & Settings
  STORE_GET: "store:get",
  STORE_SET: "store:set",
  STORE_GET_API_KEY: "store:getApiKey",
  STORE_SET_API_KEY: "store:setApiKey",
  STORE_HAS_API_KEY: "store:hasApiKey",
  STORE_CLEAR_API_KEYS: "store:clearApiKeys",
  // Messages
  MESSAGES_SAVE: "messages:save",
  MESSAGES_GET_LAST: "messages:getLast",
  MESSAGES_CLEAR: "messages:clear",
  // Audio Capture (future)
  AUDIO_START_CAPTURE: "audio:startCapture",
  AUDIO_STOP_CAPTURE: "audio:stopCapture",
  AUDIO_GET_DEVICES: "audio:getDevices",
  // Transcription (future)
  TRANSCRIPTION_START: "transcription:start",
  TRANSCRIPTION_STOP: "transcription:stop",
  TRANSCRIPTION_CHUNK: "transcription:chunk"
};
const OLLAMA_BASE_URL = "http://localhost:11434";
async function checkOllamaStatus() {
  try {
    const response = await electron.net.fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      return { running: false, error: `Status ${response.status}` };
    }
    const data = await response.json();
    return {
      running: true,
      version: data.version,
      models: data.models || []
    };
  } catch (err) {
    return { running: false, error: "Ollama offline" };
  }
}
async function listOllamaModels() {
  const status = await checkOllamaStatus();
  return status.running && status.models ? status.models : [];
}
async function sendChatMessage(messages, model = "llama2", stream = false) {
  try {
    const response = await electron.net.fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream
      })
    });
    if (!response.ok) {
      const error = await response.text();
      if (response.status === 404) {
        throw new Error(`Modelo "${model}" não encontrado. Instale com: ollama pull ${model}`);
      }
      throw new Error(`Ollama error: ${response.status} - ${error}`);
    }
    return response;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Não foi possível conectar ao Ollama. Certifique-se de que está rodando: ollama serve");
    }
    throw err;
  }
}
let currentStream = null;
function registerOllamaHandlers() {
  electron.ipcMain.handle(IPC.OLLAMA_CHECK_STATUS, async () => {
    try {
      const status = await checkOllamaStatus();
      return { success: true, data: status };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao verificar Ollama"
      };
    }
  });
  electron.ipcMain.handle(IPC.OLLAMA_LIST_MODELS, async () => {
    try {
      const models = await listOllamaModels();
      return { success: true, data: models };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao listar modelos"
      };
    }
  });
  electron.ipcMain.handle(IPC.OLLAMA_SEND_MESSAGE, async (event, messages, model) => {
    try {
      currentStream = new AbortController();
      const response = await sendChatMessage(messages, model, true);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        return { success: false, error: "No response stream" };
      }
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return { success: false, error: "Window not found" };
      }
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              window.webContents.send(IPC.AI_STREAM_CHUNK, data.message.content);
            }
            if (data.done) {
              return { success: true, data: fullResponse };
            }
          } catch (parseErr) {
            console.error("Error parsing NDJSON:", parseErr);
          }
        }
      }
      return { success: true, data: fullResponse };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, error: "Geração cancelada" };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao enviar mensagem"
      };
    } finally {
      currentStream = null;
    }
  });
  electron.ipcMain.handle(IPC.OLLAMA_STOP_GENERATION, async () => {
    if (currentStream) {
      currentStream.abort();
      currentStream = null;
      return { success: true };
    }
    return { success: false, error: "Nenhuma geração em andamento" };
  });
}
const messagesStore = new Store({
  name: "messages",
  defaults: {
    conversations: []
  }
});
function saveConversation(messages) {
  const conversations = messagesStore.get("conversations", []);
  const id = Date.now().toString();
  const conversation = {
    id,
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  conversations.unshift(conversation);
  const maxConversations = 50;
  if (conversations.length > maxConversations) {
    conversations.splice(maxConversations);
  }
  messagesStore.set("conversations", conversations);
  return id;
}
function getLastConversation() {
  const conversations = messagesStore.get("conversations", []);
  if (conversations.length === 0) return null;
  return conversations[0].messages;
}
function clearConversations() {
  messagesStore.set("conversations", []);
}
function registerMessagesHandlers() {
  electron.ipcMain.handle(IPC.MESSAGES_SAVE, async (_event, messages) => {
    try {
      const id = saveConversation(messages);
      return { success: true, data: id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao salvar mensagens"
      };
    }
  });
  electron.ipcMain.handle(IPC.MESSAGES_GET_LAST, async () => {
    try {
      const messages = getLastConversation();
      return { success: true, data: messages };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao carregar mensagens"
      };
    }
  });
  electron.ipcMain.handle(IPC.MESSAGES_CLEAR, async () => {
    try {
      clearConversations();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao limpar mensagens"
      };
    }
  });
}
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
  registerOllamaHandlers();
  registerMessagesHandlers();
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
