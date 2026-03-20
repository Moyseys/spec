import { PREFERRED_AUDIO_MIME_TYPES } from './appConstants'
import type { RecordingMetadata } from '../types/app'

export const normalizeSummaryMarkdown = (rawSummary: string) => {
  const trimmedSummary = rawSummary.trim()
  if (!trimmedSummary) {
    return ''
  }

  const fencedMarkdownMatch = trimmedSummary.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i)
  return (fencedMarkdownMatch ? fencedMarkdownMatch[1] : trimmedSummary).trim()
}

export const createRecordingId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `gravacao-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const normalizeRecordings = (value: unknown): RecordingMetadata[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const mappedRecordings = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const candidate = entry as Partial<RecordingMetadata>
      const createdAt =
        typeof candidate.createdAt === 'number'
          ? candidate.createdAt
          : typeof candidate.createdAt === 'string'
            ? Date.parse(candidate.createdAt)
            : Number.NaN

      if (
        typeof candidate.id !== 'string' ||
        !candidate.id ||
        !Number.isFinite(createdAt) ||
        typeof candidate.durationMs !== 'number' ||
        candidate.durationMs < 0 ||
        typeof candidate.size !== 'number' ||
        candidate.size < 0 ||
        typeof candidate.mimeType !== 'string' ||
        !candidate.mimeType
      ) {
        return null
      }

      return {
        id: candidate.id,
        createdAt,
        durationMs: candidate.durationMs,
        size: candidate.size,
        mimeType: candidate.mimeType,
        deviceId:
          typeof candidate.deviceId === 'string' && candidate.deviceId
            ? candidate.deviceId
            : undefined,
        title:
          typeof candidate.title === 'string' && candidate.title.trim().length > 0
            ? candidate.title.trim()
            : undefined,
        transcript:
          typeof candidate.transcript === 'string' && candidate.transcript.trim().length > 0
            ? candidate.transcript.trim()
            : undefined,
        summary:
          typeof candidate.summary === 'string' && candidate.summary.trim().length > 0
            ? normalizeSummaryMarkdown(candidate.summary)
            : undefined,
      } satisfies RecordingMetadata
    })

  const validRecordings = mappedRecordings.filter((recording) => recording !== null) as RecordingMetadata[]
  return validRecordings.sort((a, b) => b.createdAt - a.createdAt)
}

export const supportsAudioRecording = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof MediaRecorder !== 'undefined'

export const resolveAudioMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return null
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return null
  }

  return PREFERRED_AUDIO_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null
}

export const getAudioCaptureErrorMessage = (error: unknown) => {
  const domErrorName = error instanceof DOMException ? error.name : ''

  switch (domErrorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Permissão de microfone negada. Libere o acesso nas configurações do sistema.'
    case 'NotSupportedError':
      return 'Seu ambiente não suporta gravação de áudio via MediaRecorder.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum dispositivo de áudio encontrado.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Não foi possível acessar o microfone selecionado.'
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'O microfone selecionado não está disponível.'
    default:
      return 'Não foi possível iniciar a gravação de áudio.'
  }
}
