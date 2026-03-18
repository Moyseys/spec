export const IPC = {
  // AI Operations
  AI_SEND_MESSAGE: 'ai:sendMessage',
  AI_STREAM_CHUNK: 'ai:streamChunk',
  AI_CLEAR_HISTORY: 'ai:clearHistory',
  AI_LIST_MODELS: 'ai:listModels',

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

  // Audio Capture (future)
  AUDIO_START_CAPTURE: 'audio:startCapture',
  AUDIO_STOP_CAPTURE: 'audio:stopCapture',
  AUDIO_GET_DEVICES: 'audio:getDevices',

  // Transcription (future)
  TRANSCRIPTION_START: 'transcription:start',
  TRANSCRIPTION_STOP: 'transcription:stop',
  TRANSCRIPTION_CHUNK: 'transcription:chunk',
} as const;

export type IPCChannels = typeof IPC[keyof typeof IPC];
