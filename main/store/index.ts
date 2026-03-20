import Store from 'electron-store'
import { safeStorage } from 'electron'
import type {
  APIProvider,
  AppLanguage,
  AppTheme,
  DefaultAIProvider,
  RecordingMetadata,
  StoreSettingKey,
  StoreSettingValue,
} from '../../shared/ipc-channels'

export interface AppConfig {
  recordings: RecordingMetadata[]

  shortcut: string
  windowWidth: number
  windowHeight: number

  openaiApiKey?: string
  anthropicApiKey?: string
  whisperApiKey?: string

  defaultAIProvider: DefaultAIProvider
  defaultModel: string
  ollamaModel?: string
  temperature: number

  theme: AppTheme
  language: AppLanguage

  'audio.deviceId'?: string
}

type StoredAPIKeyField = 'openaiApiKey' | 'anthropicApiKey' | 'whisperApiKey'

const defaults: AppConfig = {
  recordings: [],
  shortcut: 'CommandOrControl+Shift+Space',
  windowWidth: 720,
  windowHeight: 680,

  defaultAIProvider: 'ollama',
  defaultModel: 'llama3',
  temperature: 0.7,

  theme: 'dark',
  language: 'pt',
}

export const store = new Store<AppConfig>({
  defaults,
  encryptionKey: process.env.ENCRYPTION_KEY || 'ghost-ai-assistant-v1',
})

function encryptKey(plainText: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available, storing in plain text (DEV only)')
    return Buffer.from(plainText).toString('base64')
  }
  const encrypted = safeStorage.encryptString(plainText)
  return encrypted.toString('base64')
}

function decryptKey(encryptedBase64: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encryptedBase64, 'base64').toString()
  }
  const buffer = Buffer.from(encryptedBase64, 'base64')
  return safeStorage.decryptString(buffer)
}

export function getConfig<K extends StoreSettingKey>(key: K): StoreSettingValue<K>
export function getConfig(key: string): unknown
export function getConfig(key: string): unknown {
  return store.get(key)
}

export function setConfig<K extends StoreSettingKey>(key: K, value: StoreSettingValue<K>): void
export function setConfig(key: string, value: unknown): void
export function setConfig(key: string, value: unknown): void {
  store.set(key, value)
}

export function setAPIKey(provider: APIProvider, key: string): { success: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { success: false, error: 'API key não pode ficar vazia.' }
  }

  const trimmedKey = key.trim()
  if (trimmedKey.length < 10) {
    return { success: false, error: 'API key muito curta. Verifique o valor informado.' }
  }

  const keyMap: Record<APIProvider, StoredAPIKeyField> = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    whisper: 'whisperApiKey',
  }

  try {
    const encrypted = encryptKey(trimmedKey)
    store.set(keyMap[provider], encrypted)
    return { success: true }
  } catch (err) {
    console.error(`Error saving API key for ${provider}:`, err)
    return { success: false, error: (err as Error).message }
  }
}

export function getAPIKey(provider: APIProvider): string | undefined {
  const keyMap: Record<APIProvider, StoredAPIKeyField> = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    whisper: 'whisperApiKey',
  }

  try {
    const encrypted = store.get(keyMap[provider])
    if (!encrypted) return undefined

    return decryptKey(encrypted)
  } catch (err) {
    console.error(`Error retrieving API key for ${provider}:`, err)
    return undefined
  }
}

export function hasAPIKey(provider: APIProvider): boolean {
  const key = getAPIKey(provider)
  return !!key && key.length > 0
}

export function clearAPIKeys(): void {
  store.delete('openaiApiKey')
  store.delete('anthropicApiKey')
  store.delete('whisperApiKey')
}

export function validateAPIKeyFormat(
  provider: APIProvider,
  key: string
): { valid: boolean; error?: string } {
  const trimmed = key.trim()

  if (!trimmed) {
    return { valid: false, error: 'API key vazia.' }
  }

  switch (provider) {
    case 'openai':
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'A chave da OpenAI deve começar com "sk-".' }
      }
      if (trimmed.length < 40) {
        return { valid: false, error: 'A chave da OpenAI parece curta demais.' }
      }
      break

    case 'anthropic':
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'A chave da Anthropic deve começar com "sk-ant-".' }
      }
      break

    case 'whisper':
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'A chave para Whisper deve começar com "sk-".' }
      }
      break
  }

  return { valid: true }
}
