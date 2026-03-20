import type {
  DefaultAIProvider,
  OllamaModel,
  OllamaStatus,
} from '@shared/ipc-channels'

export type Provider = DefaultAIProvider
export type ApiProvider = Exclude<DefaultAIProvider, 'ollama'>

export type StatusMessage = {
  type: 'success' | 'error'
  text: string
}

export type ApiKeyValues = Record<ApiProvider, string>
export type ApiProviderFlags = Record<ApiProvider, boolean>

export type AudioPermissionStatus = 'unknown' | 'granted' | 'denied' | 'unsupported'

export interface AudioStatusBadge {
  variant: 'success' | 'warning' | 'error'
  text: string
}

export type { OllamaModel, OllamaStatus }
