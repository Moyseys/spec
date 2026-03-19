export interface GhostAPI {
  // AI Operations
  sendMessage: (message: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  clearHistory: () => Promise<{ success: boolean; error?: string }>;
  listModels: () => Promise<{ success: boolean; data?: string[]; error?: string }>;

  // Ollama Operations
  ollama: {
    checkStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
    listModels: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    sendMessage: (messages: any[], model: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    stopGeneration: () => Promise<{ success: boolean; error?: string }>;
  };

  // Window Operations
  hideWindow: () => void;
  toggleWindow: () => void;

  // Settings
  getSetting: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;

  // Messages
  messages: {
    save: (messages: any[]) => Promise<{ success: boolean; data?: string; error?: string }>;
    getLast: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    clear: () => Promise<{ success: boolean; error?: string }>;
  };

  // API Key Management
  setAPIKey: (
    provider: 'openai' | 'anthropic' | 'whisper',
    key: string
  ) => Promise<{ success: boolean; error?: string }>;
  getAPIKey: (
    provider: 'openai' | 'anthropic' | 'whisper'
  ) => Promise<{ success: boolean; data?: string; error?: string }>;
  hasAPIKey: (
    provider: 'openai' | 'anthropic' | 'whisper'
  ) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  clearAPIKeys: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    ghost: GhostAPI;
  }
}

export {};
