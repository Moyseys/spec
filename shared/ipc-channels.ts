export type APIProvider = 'openai' | 'anthropic' | 'whisper'
export type DefaultAIProvider = 'openai' | 'anthropic' | 'ollama'
export type AppTheme = 'dark' | 'light'
export type AppLanguage = 'pt' | 'en'

export type IpcResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export interface OllamaStatus {
  running: boolean
  version?: string
  models?: OllamaModel[]
  error?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface RecordedAudio {
  id: string
  size: number
  durationMs: number
  mimeType: string
  createdAt: number
}

export interface RecordingMetadata extends RecordedAudio {
  deviceId?: string
  title?: string
  transcript?: string
  summary?: string
}

export interface TranscribeRecordingPayload {
  recordingId: string
  audioBuffer: ArrayBuffer
  mimeType?: string
}

export interface TranscriptionResultPayload {
  recordingId: string
  transcript: string
}

export type TranscriptionResponseData = string | TranscriptionResultPayload

export interface SummaryRequestPayload {
  recordingId: string
  transcript: string
  model: string
}

export interface SummaryResultPayload {
  recordingId: string
  summary: string
}

export const STORE_SETTING_KEYS = {
  DEFAULT_AI_PROVIDER: 'defaultAIProvider',
  DEFAULT_MODEL: 'defaultModel',
  OLLAMA_MODEL: 'ollamaModel',
  AUDIO_DEVICE_ID: 'audio.deviceId',
  RECORDINGS: 'recordings',
  SHORTCUT: 'shortcut',
  WINDOW_WIDTH: 'windowWidth',
  WINDOW_HEIGHT: 'windowHeight',
  TEMPERATURE: 'temperature',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

export interface StoreSettingValueMap {
  [STORE_SETTING_KEYS.DEFAULT_AI_PROVIDER]: DefaultAIProvider
  [STORE_SETTING_KEYS.DEFAULT_MODEL]: string
  [STORE_SETTING_KEYS.OLLAMA_MODEL]?: string
  [STORE_SETTING_KEYS.AUDIO_DEVICE_ID]?: string
  [STORE_SETTING_KEYS.RECORDINGS]: RecordingMetadata[]
  [STORE_SETTING_KEYS.SHORTCUT]: string
  [STORE_SETTING_KEYS.WINDOW_WIDTH]: number
  [STORE_SETTING_KEYS.WINDOW_HEIGHT]: number
  [STORE_SETTING_KEYS.TEMPERATURE]: number
  [STORE_SETTING_KEYS.THEME]: AppTheme
  [STORE_SETTING_KEYS.LANGUAGE]: AppLanguage
}

export type StoreSettingKey = keyof StoreSettingValueMap

export type StoreSettingValue<K extends StoreSettingKey = StoreSettingKey> = StoreSettingValueMap[K]

const KNOWN_STORE_SETTING_KEY_SET = new Set<StoreSettingKey>(Object.values(STORE_SETTING_KEYS))

export const isStoreSettingKey = (key: string): key is StoreSettingKey =>
  KNOWN_STORE_SETTING_KEY_SET.has(key as StoreSettingKey)

export interface StoreGetRequest<K extends StoreSettingKey = StoreSettingKey> {
  key: K
}

export interface StoreSetRequest<K extends StoreSettingKey = StoreSettingKey> {
  key: K
  value: StoreSettingValue<K>
}

export interface GhostAPI {
  // AI Operations
  sendMessage: (message: string) => Promise<IpcResponse<string>>
  onStreamChunk: (callback: (chunk: string) => void) => () => void
  clearHistory: () => Promise<IpcResponse<void>>
  listModels: () => Promise<IpcResponse<string[]>>

  // Ollama Operations
  ollama: {
    checkStatus: () => Promise<IpcResponse<OllamaStatus>>
    listModels: () => Promise<IpcResponse<OllamaModel[]>>
    sendMessage: (messages: OllamaMessage[], model: string) => Promise<IpcResponse<string>>
    stopGeneration: () => Promise<IpcResponse<void>>
  }

  // Window Operations
  hideWindow: () => void
  toggleWindow: () => void

  // Settings
  getSetting: <K extends StoreSettingKey>(key: K) => Promise<IpcResponse<StoreSettingValue<K>>>
  setSetting: <K extends StoreSettingKey>(
    key: K,
    value: StoreSettingValue<K>
  ) => Promise<IpcResponse<void>>

  // Messages
  messages: {
    save: (messages: ConversationMessage[]) => Promise<IpcResponse<string>>
    getLast: () => Promise<IpcResponse<ConversationMessage[] | null>>
    clear: () => Promise<IpcResponse<void>>
  }

  // API Key Management
  setAPIKey: (provider: APIProvider, key: string) => Promise<IpcResponse<void>>
  getAPIKey: (provider: APIProvider) => Promise<IpcResponse<string | undefined>>
  hasAPIKey: (provider: APIProvider) => Promise<IpcResponse<boolean>>
  clearAPIKeys: () => Promise<IpcResponse<void>>

  // Transcription
  transcribeRecording: (payload: TranscribeRecordingPayload) => Promise<IpcResponse<TranscriptionResponseData>>
}

export const IPC = {
  // AI Operations
  AI_SEND_MESSAGE: 'ai:sendMessage',
  AI_STREAM_CHUNK: 'ai:streamChunk',
  AI_CLEAR_HISTORY: 'ai:clearHistory',
  AI_LIST_MODELS: 'ai:listModels',

  // Ollama Operations
  OLLAMA_CHECK_STATUS: 'ollama:checkStatus',
  OLLAMA_LIST_MODELS: 'ollama:listModels',
  OLLAMA_SEND_MESSAGE: 'ollama:sendMessage',
  OLLAMA_STOP_GENERATION: 'ollama:stopGeneration',

  // Window Management
  WINDOW_HIDE: 'window:hide',
  WINDOW_TOGGLE: 'window:toggle',
  WINDOW_READY: 'window:ready',

  // Configuration & Settings
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  STORE_GET_API_KEY: 'store:getApiKey',
  STORE_SET_API_KEY: 'store:setApiKey',
  STORE_HAS_API_KEY: 'store:hasApiKey',
  STORE_CLEAR_API_KEYS: 'store:clearApiKeys',

  // Messages
  MESSAGES_SAVE: 'messages:save',
  MESSAGES_GET_LAST: 'messages:getLast',
  MESSAGES_CLEAR: 'messages:clear',

  // Audio Capture (future)
  AUDIO_START_CAPTURE: 'audio:startCapture',
  AUDIO_STOP_CAPTURE: 'audio:stopCapture',
  AUDIO_GET_DEVICES: 'audio:getDevices',

  // Transcription (future)
  TRANSCRIPTION_TRANSCRIBE: 'transcription:transcribe',
  TRANSCRIPTION_START: 'transcription:start',
  TRANSCRIPTION_STOP: 'transcription:stop',
  TRANSCRIPTION_CHUNK: 'transcription:chunk',
} as const

export type IPCChannels = typeof IPC[keyof typeof IPC]
