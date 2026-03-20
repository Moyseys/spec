import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import {
  APIProvider,
  ConversationMessage,
  GhostAPI,
  IPC,
  OllamaMessage,
  StoreSettingKey,
  StoreSettingValue,
  TranscribeRecordingPayload,
} from '../shared/ipc-channels'
import type { IpcResponse } from '../shared/ipc-channels'

const ghostApi: GhostAPI = {
  sendMessage: (message: string) => ipcRenderer.invoke(IPC.AI_SEND_MESSAGE, message),
  onStreamChunk: (callback: (chunk: string) => void) => {
    const listener = (_event: IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on(IPC.AI_STREAM_CHUNK, listener)
    return () => ipcRenderer.removeListener(IPC.AI_STREAM_CHUNK, listener)
  },
  clearHistory: () => ipcRenderer.invoke(IPC.AI_CLEAR_HISTORY),
  listModels: () => ipcRenderer.invoke(IPC.AI_LIST_MODELS),

  hideWindow: () => ipcRenderer.send(IPC.WINDOW_HIDE),
  toggleWindow: () => ipcRenderer.send(IPC.WINDOW_TOGGLE),

  getSetting: <K extends StoreSettingKey>(key: K) =>
    ipcRenderer.invoke(IPC.STORE_GET, key) as Promise<IpcResponse<StoreSettingValue<K>>>,
  setSetting: <K extends StoreSettingKey>(key: K, value: StoreSettingValue<K>) =>
    ipcRenderer.invoke(IPC.STORE_SET, key, value) as Promise<IpcResponse<void>>,

  messages: {
    save: (messages: ConversationMessage[]) => ipcRenderer.invoke(IPC.MESSAGES_SAVE, messages),
    getLast: () => ipcRenderer.invoke(IPC.MESSAGES_GET_LAST),
    clear: () => ipcRenderer.invoke(IPC.MESSAGES_CLEAR),
  },

  ollama: {
    checkStatus: () => ipcRenderer.invoke(IPC.OLLAMA_CHECK_STATUS),
    listModels: () => ipcRenderer.invoke(IPC.OLLAMA_LIST_MODELS),
    sendMessage: (messages: OllamaMessage[], model: string) =>
      ipcRenderer.invoke(IPC.OLLAMA_SEND_MESSAGE, messages, model),
    stopGeneration: () => ipcRenderer.invoke(IPC.OLLAMA_STOP_GENERATION),
  },

  setAPIKey: (provider: APIProvider, key: string) =>
    ipcRenderer.invoke(IPC.STORE_SET_API_KEY, provider, key),
  getAPIKey: (provider: APIProvider) => ipcRenderer.invoke(IPC.STORE_GET_API_KEY, provider),
  hasAPIKey: (provider: APIProvider) => ipcRenderer.invoke(IPC.STORE_HAS_API_KEY, provider),
  clearAPIKeys: () => ipcRenderer.invoke(IPC.STORE_CLEAR_API_KEYS),

  transcribeRecording: (payload: TranscribeRecordingPayload) =>
    ipcRenderer.invoke(IPC.TRANSCRIPTION_TRANSCRIBE, payload),
}

contextBridge.exposeInMainWorld('ghost', ghostApi)
