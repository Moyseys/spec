export interface GhostAPI {
  // AI Operations
  sendMessage: (message: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  clearHistory: () => Promise<{ success: boolean; error?: string }>;
  listModels: () => Promise<{ success: boolean; data?: string[]; error?: string }>;

  // Window Operations
  hideWindow: () => void;
  toggleWindow: () => void;

  // Settings
  getSetting: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;

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
