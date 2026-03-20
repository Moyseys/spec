import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../../components/ui'
import { getRecordingBlob } from '../../utils/audioStorage'
import type { RecordingMetadata, TranscriptionResponseData } from '@shared/ipc-channels'
import type { RecordingsUpdater } from './useRecordingPersistence'

interface UseRecordingTranscriptionOptions {
  recordings: RecordingMetadata[]
  isSummaryBusy: () => boolean
  updateRecordings: (updater: RecordingsUpdater) => Promise<RecordingMetadata[]>
}

export interface UseRecordingTranscriptionResult {
  transcribingRecordingId: string | null
  recordingTranscriptionErrors: Record<string, string>
  transcribeRecording: (recording: RecordingMetadata) => Promise<void>
  clearRecordingTranscriptionState: (recordingId: string) => void
}

const extractTranscript = (data: TranscriptionResponseData): string =>
  typeof data === 'string' ? data : data.transcript

export const useRecordingTranscription = ({
  recordings,
  isSummaryBusy,
  updateRecordings,
}: UseRecordingTranscriptionOptions): UseRecordingTranscriptionResult => {
  const [transcribingRecordingId, setTranscribingRecordingId] = useState<string | null>(null)
  const [recordingTranscriptionErrors, setRecordingTranscriptionErrors] = useState<
    Record<string, string>
  >({})

  const mountedRef = useRef(true)

  const clearRecordingTranscriptionState = useCallback((recordingId: string) => {
    setTranscribingRecordingId((currentId) => (currentId === recordingId ? null : currentId))
    setRecordingTranscriptionErrors((previousErrors) => {
      if (!previousErrors[recordingId]) {
        return previousErrors
      }

      const nextErrors = { ...previousErrors }
      delete nextErrors[recordingId]
      return nextErrors
    })
  }, [])

  const transcribeRecording = useCallback(
    async (recording: RecordingMetadata) => {
      if (transcribingRecordingId && transcribingRecordingId !== recording.id) {
        toast.info('Aguarde a transcrição em andamento terminar para iniciar outra.')
        return
      }

      if (isSummaryBusy()) {
        toast.info('Aguarde a geração de resumo terminar antes de transcrever outra gravação.')
        return
      }

      setTranscribingRecordingId(recording.id)
      setRecordingTranscriptionErrors((previousErrors) => {
        if (!previousErrors[recording.id]) {
          return previousErrors
        }

        const nextErrors = { ...previousErrors }
        delete nextErrors[recording.id]
        return nextErrors
      })

      try {
        const blob = await getRecordingBlob(recording.id)

        if (!blob) {
          throw new Error('Áudio não encontrado no armazenamento local para transcrição.')
        }

        const audioBuffer = await blob.arrayBuffer()
        const transcriptionResult = await window.ghost.transcribeRecording({
          recordingId: recording.id,
          audioBuffer,
          mimeType: blob.type || recording.mimeType,
        })

        if (!transcriptionResult.success) {
          throw new Error(transcriptionResult.error)
        }

        if (!transcriptionResult.data) {
          throw new Error('Não foi possível concluir a transcrição desta gravação.')
        }

        const transcript = extractTranscript(transcriptionResult.data).trim()
        if (!transcript) {
          throw new Error('A transcrição retornou vazia para este áudio.')
        }

        await updateRecordings((entries) =>
          entries.map((entry) => (entry.id === recording.id ? { ...entry, transcript } : entry))
        )
        toast.success('Transcrição concluída com sucesso.')
      } catch (err) {
        console.error('Error transcribing recording:', err)
        const message =
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : 'Erro inesperado ao transcrever a gravação.'

        if (mountedRef.current) {
          setRecordingTranscriptionErrors((previousErrors) => ({
            ...previousErrors,
            [recording.id]: message,
          }))
        }

        toast.error(message)
      } finally {
        if (mountedRef.current) {
          setTranscribingRecordingId((currentId) =>
            currentId === recording.id ? null : currentId
          )
        }
      }
    },
    [isSummaryBusy, transcribingRecordingId, updateRecordings]
  )

  useEffect(() => {
    if (!transcribingRecordingId) {
      return
    }

    if (recordings.some((recording) => recording.id === transcribingRecordingId)) {
      return
    }

    setTranscribingRecordingId(null)
  }, [recordings, transcribingRecordingId])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    transcribingRecordingId,
    recordingTranscriptionErrors,
    transcribeRecording,
    clearRecordingTranscriptionState,
  }
}
