import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC } from '../shared/ipc-channels'

// Exposing the ghost API to the renderer process
contextBridge.exposeInMainWorld('ghost', {
  // AI Communication
  sendMessage: (message: string) => ipcRenderer.invoke(IPC.AI_SEND_MESSAGE, message),
  onStreamChunk: (callback: (chunk: string) => void) => {
    const listener = (_event: IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on(IPC.AI_STREAM_CHUNK, listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener(IPC.AI_STREAM_CHUNK, listener);
  },
  clearHistory: () => ipcRenderer.invoke(IPC.AI_CLEAR_HISTORY),
  listModels: () => ipcRenderer.invoke(IPC.AI_LIST_MODELS),

  // Window Operations
  hideWindow: () => ipcRenderer.send(IPC.WINDOW_HIDE),
  toggleWindow: () => ipcRenderer.send(IPC.WINDOW_TOGGLE),

  // Store
  getSetting: (key: string) => ipcRenderer.invoke(IPC.STORE_GET, key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke(IPC.STORE_SET, key, value),

  // Messages
  messages: {
    save: (messages: any[]) => ipcRenderer.invoke(IPC.MESSAGES_SAVE, messages),
    getLast: () => ipcRenderer.invoke(IPC.MESSAGES_GET_LAST),
    clear: () => ipcRenderer.invoke(IPC.MESSAGES_CLEAR)
  },

  // Ollama Operations
  ollama: {
    checkStatus: () => ipcRenderer.invoke(IPC.OLLAMA_CHECK_STATUS),
    listModels: () => ipcRenderer.invoke(IPC.OLLAMA_LIST_MODELS),
    sendMessage: (messages: any[], model: string) => 
      ipcRenderer.invoke(IPC.OLLAMA_SEND_MESSAGE, messages, model),
    stopGeneration: () => ipcRenderer.invoke(IPC.OLLAMA_STOP_GENERATION)
  },

  // API Key Management
  setAPIKey: (provider: 'openai' | 'anthropic' | 'whisper', key: string) =>
    ipcRenderer.invoke(IPC.STORE_SET_API_KEY, provider, key),
  getAPIKey: (provider: 'openai' | 'anthropic' | 'whisper') =>
    ipcRenderer.invoke(IPC.STORE_GET_API_KEY, provider),
  hasAPIKey: (provider: 'openai' | 'anthropic' | 'whisper') =>
    ipcRenderer.invoke(IPC.STORE_HAS_API_KEY, provider),
  clearAPIKeys: () => ipcRenderer.invoke(IPC.STORE_CLEAR_API_KEYS)
})
