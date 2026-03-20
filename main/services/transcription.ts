import { net } from 'electron'

const OPENAI_TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions'
const OPENAI_TRANSCRIPTION_MODEL = 'whisper-1'

interface OpenAITranscriptionOptions {
  apiKey: string
  audioBuffer: ArrayBuffer
  mimeType?: string
  fileName?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const resolveExtensionFromMimeType = (mimeType?: string) => {
  if (!mimeType) return 'webm'

  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('webm')) return 'webm'

  return 'webm'
}

const extractOpenAIErrorMessage = (rawError: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(rawError)

    if (isRecord(parsed) && 'error' in parsed && isRecord(parsed.error)) {
      const nestedMessage = parsed.error.message
      if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
        return nestedMessage
      }
    }

    if (isRecord(parsed) && 'message' in parsed) {
      const message = parsed.message
      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }
    }

    return null
  } catch (parseError) {
    console.warn('OpenAI transcription error payload is not valid JSON:', parseError)
    return null
  }
}

const mapOpenAIStatusToMessage = (status: number, fallback?: string): string => {
  if (status === 401) {
    return 'API key da OpenAI inválida ou expirada. Atualize a chave em Configurações.'
  }

  if (status === 429) {
    return 'Limite de uso da OpenAI atingido. Aguarde e tente novamente.'
  }

  if (status >= 500) {
    return 'A OpenAI está indisponível no momento. Tente novamente em instantes.'
  }

  return fallback || `Falha na transcrição (OpenAI retornou status ${status}).`
}

export async function transcribeAudioWithOpenAI(
  options: OpenAITranscriptionOptions
): Promise<string> {
  const { apiKey, audioBuffer, mimeType, fileName } = options

  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key não configurada para transcrição.')
  }

  if (!(audioBuffer instanceof ArrayBuffer) || audioBuffer.byteLength === 0) {
    throw new Error('Arquivo de áudio inválido para transcrição.')
  }

  const extension = resolveExtensionFromMimeType(mimeType)
  const safeFileName =
    fileName && fileName.trim().length > 0 ? fileName.trim() : `gravacao.${extension}`
  const audioBlob = new Blob([Buffer.from(audioBuffer)], {
    type: mimeType || 'audio/webm',
  })

  const formData = new FormData()
  formData.append('model', OPENAI_TRANSCRIPTION_MODEL)
  formData.append('response_format', 'text')
  formData.append('language', 'pt')
  formData.append('file', audioBlob, safeFileName)

  try {
    const response = await net.fetch(OPENAI_TRANSCRIPTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const rawError = await response.text()
      const parsedMessage = extractOpenAIErrorMessage(rawError)
      throw new Error(mapOpenAIStatusToMessage(response.status, parsedMessage || undefined))
    }

    const transcript = (await response.text()).trim()

    if (!transcript) {
      throw new Error('A OpenAI retornou transcrição vazia para este áudio.')
    }

    return transcript
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TypeError') {
        throw new Error('Falha de rede ao enviar áudio para transcrição. Verifique sua conexão.')
      }
      throw err
    }

    throw new Error('Erro inesperado ao transcrever áudio.')
  }
}
