"use strict";
const electron = require("electron");
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
  MESSAGES_CLEAR: "messages:clear"
};
electron.contextBridge.exposeInMainWorld("ghost", {
  // AI Communication
  sendMessage: (message) => electron.ipcRenderer.invoke(IPC.AI_SEND_MESSAGE, message),
  onStreamChunk: (callback) => {
    const listener = (_event, chunk) => callback(chunk);
    electron.ipcRenderer.on(IPC.AI_STREAM_CHUNK, listener);
    return () => electron.ipcRenderer.removeListener(IPC.AI_STREAM_CHUNK, listener);
  },
  clearHistory: () => electron.ipcRenderer.invoke(IPC.AI_CLEAR_HISTORY),
  listModels: () => electron.ipcRenderer.invoke(IPC.AI_LIST_MODELS),
  // Window Operations
  hideWindow: () => electron.ipcRenderer.send(IPC.WINDOW_HIDE),
  toggleWindow: () => electron.ipcRenderer.send(IPC.WINDOW_TOGGLE),
  // Store
  getSetting: (key) => electron.ipcRenderer.invoke(IPC.STORE_GET, key),
  setSetting: (key, value) => electron.ipcRenderer.invoke(IPC.STORE_SET, key, value),
  // Messages
  messages: {
    save: (messages) => electron.ipcRenderer.invoke(IPC.MESSAGES_SAVE, messages),
    getLast: () => electron.ipcRenderer.invoke(IPC.MESSAGES_GET_LAST),
    clear: () => electron.ipcRenderer.invoke(IPC.MESSAGES_CLEAR)
  },
  // Ollama Operations
  ollama: {
    checkStatus: () => electron.ipcRenderer.invoke(IPC.OLLAMA_CHECK_STATUS),
    listModels: () => electron.ipcRenderer.invoke(IPC.OLLAMA_LIST_MODELS),
    sendMessage: (messages, model) => electron.ipcRenderer.invoke(IPC.OLLAMA_SEND_MESSAGE, messages, model),
    stopGeneration: () => electron.ipcRenderer.invoke(IPC.OLLAMA_STOP_GENERATION)
  },
  // API Key Management
  setAPIKey: (provider, key) => electron.ipcRenderer.invoke(IPC.STORE_SET_API_KEY, provider, key),
  getAPIKey: (provider) => electron.ipcRenderer.invoke(IPC.STORE_GET_API_KEY, provider),
  hasAPIKey: (provider) => electron.ipcRenderer.invoke(IPC.STORE_HAS_API_KEY, provider),
  clearAPIKeys: () => electron.ipcRenderer.invoke(IPC.STORE_CLEAR_API_KEYS)
});
