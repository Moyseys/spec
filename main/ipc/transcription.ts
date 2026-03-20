import { ipcMain } from 'electron'
import type { IpcResponse, TranscriptionResultPayload } from '../../shared/ipc-channels'
import { IPC } from '../../shared/ipc-channels'
import { getAPIKey, hasAPIKey } from '../store'
import { transcribeAudioWithOpenAI } from '../services/transcription'
import { errorMessageFromUnknown, fail, logIpcError, ok, parseTranscriptionPayload } from './utils'

export function registerTranscriptionHandlers(): void {
  ipcMain.handle(
    IPC.TRANSCRIPTION_TRANSCRIBE,
    async (_event, payload: unknown): Promise<IpcResponse<TranscriptionResultPayload>> => {
      const parsedPayload = parseTranscriptionPayload(payload)
      if (!parsedPayload.ok) {
        return fail(parsedPayload.error)
      }

      const { recordingId, audioBuffer, mimeType } = parsedPayload.value

      try {
        if (!hasAPIKey('openai')) {
          return fail(
            'Transcrição indisponível: configure sua OpenAI API key em Configurações para continuar.'
          )
        }

        const openaiApiKey = getAPIKey('openai')
        if (!openaiApiKey) {
          return fail(
            'Transcrição indisponível: não foi possível carregar sua OpenAI API key. Reconfigure em Configurações.'
          )
        }

        const transcript = await transcribeAudioWithOpenAI({
          apiKey: openaiApiKey,
          audioBuffer,
          mimeType,
          fileName: `${recordingId}.webm`,
        })

        return ok({ recordingId, transcript })
      } catch (err) {
        logIpcError('transcription:transcribe', err)
        return fail(errorMessageFromUnknown(err, 'Não foi possível concluir a transcrição do áudio.'))
      }
    }
  )
}
