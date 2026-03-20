import { PREFERRED_AUDIO_MIME_TYPES } from '../constants'
import type { ChatMessage, RecordingMetadata } from '../types'

export const buildMeetingSummaryMessages = (transcript: string): ChatMessage[] => [
  {
    role: 'system',
    content:
      'Você é um assistente especialista em reuniões. Responda sempre em português brasileiro, com objetividade e clareza.',
  },
  {
    role: 'user',
    content: `Analise a transcrição abaixo e gere um resumo em markdown.

Use apenas fatos presentes na transcrição. Não invente informações.
Se responsável ou prazo não estiverem claros, use "Não identificado".
Não use blocos de código.

Formato obrigatório:
## Resumo executivo
Parágrafo curto (3 a 5 frases).

## Tópicos principais
- Item 1
- Item 2

## Próximos passos (action items)
- [ ] Ação — responsável: ... — prazo: ...

Transcrição:
${transcript}`,
  },
]

export const normalizeSummaryMarkdown = (rawSummary: string) => {
  const trimmedSummary = rawSummary.trim()
  if (!trimmedSummary) {
    return ''
  }

  const fencedMarkdownMatch = trimmedSummary.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i)
  return (fencedMarkdownMatch ? fencedMarkdownMatch[1] : trimmedSummary).trim()
}

export const normalizeRecordings = (value: unknown): RecordingMetadata[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
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
    .filter((recording): recording is RecordingMetadata => recording !== null)
    .sort((a, b) => b.createdAt - a.createdAt)
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

export const getMeetingSummaryErrorMessage = (error: unknown) => {
  const fallbackMessage = 'Não foi possível gerar o resumo desta gravação.'
  if (!(error instanceof Error)) {
    return fallbackMessage
  }

  const message = error.message?.trim() || fallbackMessage
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('offline') ||
    normalizedMessage.includes('conectar') ||
    normalizedMessage.includes('connection') ||
    normalizedMessage.includes('fetch') ||
    normalizedMessage.includes('certifique-se')
  ) {
    return 'Não foi possível conectar ao Ollama. Verifique se o serviço está rodando e tente novamente.'
  }

  if (normalizedMessage.includes('modelo') || normalizedMessage.includes('model')) {
    if (message.startsWith('Modelo')) {
      return message
    }
    return `Erro no modelo do Ollama: ${message}`
  }

  return message
}
