import Store from 'electron-store';
import { safeStorage } from 'electron';

export interface AppConfig {
  // Window & Shortcuts
  shortcut: string;
  windowWidth: number;
  windowHeight: number;

  // API Keys (encrypted with safeStorage - stored as base64)
  openaiApiKey?: string;
  anthropicApiKey?: string;
  whisperApiKey?: string;

  // AI Settings
  defaultAIProvider: 'openai' | 'anthropic' | 'ollama';
  defaultModel: string;
  temperature: number;

  // UI Preferences
  theme: 'dark' | 'light';
  language: 'pt' | 'en';
}

const defaults: AppConfig = {
  shortcut: 'CommandOrControl+Shift+Space',
  windowWidth: 720,
  windowHeight: 680,

  defaultAIProvider: 'ollama',
  defaultModel: 'llama3',
  temperature: 0.7,

  theme: 'dark',
  language: 'pt',
};

export const store = new Store<AppConfig>({
  defaults,
  // electron-store encryption - segunda camada de segurança
  encryptionKey: 'ghost-ai-assistant-v1',
});

// Encryption helpers usando safeStorage do Electron
function encryptKey(plainText: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available, storing in plain text (DEV only)');
    return Buffer.from(plainText).toString('base64');
  }
  const encrypted = safeStorage.encryptString(plainText);
  return encrypted.toString('base64');
}

function decryptKey(encryptedBase64: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encryptedBase64, 'base64').toString();
  }
  const buffer = Buffer.from(encryptedBase64, 'base64');
  return safeStorage.decryptString(buffer);
}

// Type-safe getters/setters
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return store.get(key);
}

export function setConfig<K extends keyof AppConfig>(
  key: K,
  value: AppConfig[K]
): void {
  store.set(key, value);
}

// API Key management com encriptação usando safeStorage
export function setAPIKey(
  provider: 'openai' | 'anthropic' | 'whisper',
  key: string
): { success: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { success: false, error: 'API key cannot be empty' };
  }

  // Validação básica do formato da key
  const trimmedKey = key.trim();
  if (trimmedKey.length < 10) {
    return { success: false, error: 'API key too short - please check' };
  }

  const keyMap = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    whisper: 'whisperApiKey',
  } as const;

  try {
    // Encriptar antes de salvar
    const encrypted = encryptKey(trimmedKey);
    store.set(keyMap[provider], encrypted);
    console.log(`API key for ${provider} saved securely`);
    return { success: true };
  } catch (err) {
    console.error(`Error saving API key for ${provider}:`, err);
    return { success: false, error: (err as Error).message };
  }
}

export function getAPIKey(
  provider: 'openai' | 'anthropic' | 'whisper'
): string | undefined {
  const keyMap = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    whisper: 'whisperApiKey',
  } as const;

  try {
    const encrypted = store.get(keyMap[provider]);
    if (!encrypted) return undefined;
    
    // Decriptar antes de retornar
    return decryptKey(encrypted);
  } catch (err) {
    console.error(`Error retrieving API key for ${provider}:`, err);
    return undefined;
  }
}

export function hasAPIKey(provider: 'openai' | 'anthropic' | 'whisper'): boolean {
  const key = getAPIKey(provider);
  return !!key && key.length > 0;
}

export function clearAPIKeys(): void {
  store.delete('openaiApiKey');
  store.delete('anthropicApiKey');
  store.delete('whisperApiKey');
  console.log('All API keys cleared');
}

// Helper para testar se uma API key é válida (formato)
export function validateAPIKeyFormat(
  provider: 'openai' | 'anthropic' | 'whisper',
  key: string
): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'API key is empty' };
  }

  // Validações específicas por provider
  switch (provider) {
    case 'openai':
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI keys should start with "sk-"' };
      }
      if (trimmed.length < 40) {
        return { valid: false, error: 'OpenAI key too short' };
      }
      break;
    
    case 'anthropic':
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'Anthropic keys should start with "sk-ant-"' };
      }
      break;
    
    case 'whisper':
      // Whisper usa mesma key da OpenAI
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'Whisper keys should start with "sk-"' };
      }
      break;
  }

  return { valid: true };
}
