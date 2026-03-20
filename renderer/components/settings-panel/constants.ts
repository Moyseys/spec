import type { ApiKeyValues, ApiProvider, ApiProviderFlags, Provider } from './types'

export const PROVIDERS: Provider[] = ['ollama', 'openai', 'anthropic']
export const API_PROVIDERS: ApiProvider[] = ['openai', 'anthropic']

export const EMPTY_API_KEYS: ApiKeyValues = {
  openai: '',
  anthropic: '',
}

export const EMPTY_API_FLAGS: ApiProviderFlags = {
  openai: false,
  anthropic: false,
}
