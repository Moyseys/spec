import {
  STORE_SETTING_KEYS,
  isStoreSettingKey,
} from '../../shared/ipc-channels'
import type {
  APIProvider,
  AppLanguage,
  AppTheme,
  ConversationMessage,
  DefaultAIProvider,
  IpcResponse,
  OllamaMessage,
  RecordingMetadata,
  StoreSettingKey,
  StoreSettingValue,
  TranscribeRecordingPayload,
} from '../../shared/ipc-channels'

const API_PROVIDERS: APIProvider[] = ['openai', 'anthropic', 'whisper']
const DEFAULT_AI_PROVIDERS: DefaultAIProvider[] = ['openai', 'anthropic', 'ollama']
const APP_THEMES: AppTheme[] = ['dark', 'light']
const APP_LANGUAGES: AppLanguage[] = ['pt', 'en']

const FORBIDDEN_STORE_KEY_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])
const OLLAMA_ROLES = new Set<OllamaMessage['role']>(['system', 'user', 'assistant'])
const CONVERSATION_ROLES = new Set<ConversationMessage['role']>(['user', 'assistant'])

export function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

export function fail(error: string): IpcResponse<never> {
  return { success: false, error }
}

export function errorMessageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }

  return fallback
}

export function logIpcError(scope: string, err: unknown): void {
  console.error(`[IPC:${scope}]`, err)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isString = (value: unknown): value is string => typeof value === 'string'

const isOptionalString = (value: unknown): value is string | undefined =>
  typeof value === 'undefined' || typeof value === 'string'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isArrayBufferLike = (value: unknown): value is ArrayBuffer =>
  value instanceof ArrayBuffer || Object.prototype.toString.call(value) === '[object ArrayBuffer]'

const isDefaultAIProvider = (value: unknown): value is DefaultAIProvider =>
  typeof value === 'string' && DEFAULT_AI_PROVIDERS.includes(value as DefaultAIProvider)

const isAppTheme = (value: unknown): value is AppTheme =>
  typeof value === 'string' && APP_THEMES.includes(value as AppTheme)

const isAppLanguage = (value: unknown): value is AppLanguage =>
  typeof value === 'string' && APP_LANGUAGES.includes(value as AppLanguage)

const isRecordingMetadata = (value: unknown): value is RecordingMetadata => {
  if (!isRecord(value)) {
    return false
  }

  if (
    !isNonEmptyString(value.id) ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.durationMs) ||
    value.durationMs < 0 ||
    !isFiniteNumber(value.size) ||
    value.size < 0 ||
    !isNonEmptyString(value.mimeType)
  ) {
    return false
  }

  if (
    !isOptionalString(value.deviceId) ||
    !isOptionalString(value.title) ||
    !isOptionalString(value.transcript) ||
    !isOptionalString(value.summary)
  ) {
    return false
  }

  return true
}

export function parseStoreKey(value: unknown):
  | { ok: true; value: StoreSettingKey }
  | { ok: false; error: string } {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: 'Chave de configuração inválida.' }
  }

  const key = value.trim()

  if (key.length > 200) {
    return { ok: false, error: 'Chave de configuração excede o tamanho permitido.' }
  }

  const hasForbiddenSegment = key
    .split('.')
    .some((segment) => FORBIDDEN_STORE_KEY_SEGMENTS.has(segment))

  if (hasForbiddenSegment) {
    return { ok: false, error: 'Chave de configuração contém segmento não permitido.' }
  }

  if (!isStoreSettingKey(key)) {
    return { ok: false, error: 'Chave de configuração não suportada.' }
  }

  return { ok: true, value: key }
}

export function parseStoreValue<K extends StoreSettingKey>(
  key: K,
  value: unknown
):
  | { ok: true; value: StoreSettingValue<K> }
  | { ok: false; error: string } {
  switch (key) {
    case STORE_SETTING_KEYS.DEFAULT_AI_PROVIDER:
      if (!isDefaultAIProvider(value)) {
        return { ok: false, error: 'Provider padrão inválido.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.DEFAULT_MODEL:
    case STORE_SETTING_KEYS.SHORTCUT:
      if (!isString(value)) {
        return { ok: false, error: 'Valor de configuração inválido.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.OLLAMA_MODEL:
    case STORE_SETTING_KEYS.AUDIO_DEVICE_ID:
      if (!isOptionalString(value)) {
        return { ok: false, error: 'Valor de configuração inválido.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.WINDOW_WIDTH:
    case STORE_SETTING_KEYS.WINDOW_HEIGHT:
      if (!isFiniteNumber(value) || value <= 0) {
        return { ok: false, error: 'Dimensão de janela inválida.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.TEMPERATURE:
      if (!isFiniteNumber(value)) {
        return { ok: false, error: 'Temperatura inválida.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.THEME:
      if (!isAppTheme(value)) {
        return { ok: false, error: 'Tema inválido.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.LANGUAGE:
      if (!isAppLanguage(value)) {
        return { ok: false, error: 'Idioma inválido.' }
      }
      return { ok: true, value: value as StoreSettingValue<K> }

    case STORE_SETTING_KEYS.RECORDINGS:
      if (!Array.isArray(value)) {
        return { ok: false, error: 'Lista de gravações inválida.' }
      }

      if (!value.every((entry) => isRecordingMetadata(entry))) {
        return { ok: false, error: 'Metadados de gravações inválidos.' }
      }

      return { ok: true, value: value as StoreSettingValue<K> }

    default: {
      const exhaustiveCheck: never = key
      return exhaustiveCheck
    }
  }
}

export function parseApiProvider(value: unknown):
  | { ok: true; value: APIProvider }
  | { ok: false; error: string } {
  if (typeof value !== 'string' || !API_PROVIDERS.includes(value as APIProvider)) {
    return { ok: false, error: 'Provider de API inválido.' }
  }

  return { ok: true, value: value as APIProvider }
}

export function parseConversationMessages(value: unknown):
  | { ok: true; value: ConversationMessage[] }
  | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'Payload de mensagens inválido.' }
  }

  const normalized: ConversationMessage[] = []

  for (const item of value) {
    if (!isRecord(item)) {
      return { ok: false, error: 'Mensagem inválida no payload.' }
    }

    const role = item.role
    const content = item.content
    const timestamp = item.timestamp

    if (typeof role !== 'string' || !CONVERSATION_ROLES.has(role as ConversationMessage['role'])) {
      return { ok: false, error: 'Papel da mensagem inválido.' }
    }

    if (typeof content !== 'string') {
      return { ok: false, error: 'Conteúdo da mensagem inválido.' }
    }

    if (
      typeof timestamp !== 'undefined' &&
      (typeof timestamp !== 'number' || !Number.isFinite(timestamp))
    ) {
      return { ok: false, error: 'Timestamp da mensagem inválido.' }
    }

    const normalizedRole = role as ConversationMessage['role']

    normalized.push(
      typeof timestamp === 'number'
        ? { role: normalizedRole, content, timestamp }
        : { role: normalizedRole, content }
    )
  }

  return { ok: true, value: normalized }
}

export function parseOllamaMessages(value: unknown):
  | { ok: true; value: OllamaMessage[] }
  | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'Payload de contexto do chat inválido.' }
  }

  const normalized: OllamaMessage[] = []

  for (const item of value) {
    if (!isRecord(item)) {
      return { ok: false, error: 'Mensagem inválida no contexto do chat.' }
    }

    const role = item.role
    const content = item.content

    if (typeof role !== 'string' || !OLLAMA_ROLES.has(role as OllamaMessage['role'])) {
      return { ok: false, error: 'Papel da mensagem do chat inválido.' }
    }

    if (typeof content !== 'string') {
      return { ok: false, error: 'Conteúdo da mensagem do chat inválido.' }
    }

    const normalizedRole = role as OllamaMessage['role']
    normalized.push({ role: normalizedRole, content })
  }

  return { ok: true, value: normalized }
}

export function parseModelName(value: unknown):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: 'Nome do modelo inválido.' }
  }

  return { ok: true, value: value.trim() }
}

export function parseApiKey(value: unknown):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  if (!isNonEmptyString(value)) {
    return { ok: false, error: 'API key inválida.' }
  }

  return { ok: true, value: value.trim() }
}

export function parseTranscriptionPayload(value: unknown):
  | { ok: true; value: TranscribeRecordingPayload }
  | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: 'Payload de transcrição inválido.' }
  }

  const recordingId = value.recordingId
  const audioBuffer = value.audioBuffer
  const mimeType = value.mimeType

  if (!isNonEmptyString(recordingId)) {
    return { ok: false, error: 'Identificador da gravação não informado.' }
  }

  if (!isArrayBufferLike(audioBuffer) || audioBuffer.byteLength === 0) {
    return { ok: false, error: 'Áudio da gravação não enviado para transcrição.' }
  }

  if (typeof mimeType !== 'undefined' && typeof mimeType !== 'string') {
    return { ok: false, error: 'Tipo MIME do áudio inválido.' }
  }

  return {
    ok: true,
    value: {
      recordingId: recordingId.trim(),
      audioBuffer,
      mimeType,
    },
  }
}
